"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  checkpointDatabase,
  getDb,
  isEphemeralServerlessDatabase,
} from "@/lib/db";
import {
  clearImportPersistenceMeta,
  recordSuccessfulImport,
} from "@/lib/db/import-persistence";
import { categories, categoryRules, transactions } from "@/lib/db/schema";
import { guessCategory } from "@/lib/import/category-matcher";
import { decodeBankFile, parseBankCsv } from "@/lib/import/csv-parser";

const INSERT_BATCH = 80;

function buildImportMessage(imported: number, skipped: number, total: number, replaced: boolean): string {
  if (imported === 0 && skipped > 0) {
    return `Toutes les ${skipped} transactions sont déjà en base.\nRien n'a été modifié — vos données restent enregistrées.`;
  }
  if (imported > 0 && skipped === 0) {
    return replaced
      ? `${imported} transaction(s) enregistrée(s). L'ancien import a été remplacé.\nElles restent en base Turso jusqu'au prochain CSV.`
      : `${imported} transaction(s) ajoutée(s) en base.\nElles restent enregistrées jusqu'au prochain remplacement.`;
  }
  if (imported > 0 && skipped > 0) {
    return `${imported} transaction(s) ajoutée(s), ${skipped} déjà présente(s) (ignorées).`;
  }
  return `Aucune nouvelle transaction sur ${total} ligne(s) analysée(s).`;
}

function revalidateImportPaths() {
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/import");
  revalidatePath("/budgets");
}

export async function getImportStats() {
  const db = await getDb();
  const [result] = await db
    .select({
      count: sql<number>`count(*)`,
      lastImportedAt: sql<string | null>`max(${transactions.createdAt})`,
      latestTransactionDate: sql<string | null>`max(${transactions.date})`,
    })
    .from(transactions)
    .where(eq(transactions.source, "import"));

  return {
    importedCount: result?.count ?? 0,
    lastImportedAt: result?.lastImportedAt ?? null,
    latestTransactionDate: result?.latestTransactionDate ?? null,
  };
}

export async function clearImportedTransactions() {
  const db = await getDb();
  await db.delete(transactions).where(eq(transactions.source, "import"));
  await clearImportPersistenceMeta(db);
  checkpointDatabase();
  revalidateImportPaths();

  return {
    success: true,
    message: "Imports bancaires supprimés. La base est vide — importez un nouveau CSV pour recommencer.",
  };
}

type ParsedRow = {
  date: string;
  label: string;
  amount: number;
  type: "expense" | "income";
  bankReference?: string;
};

export async function importBankCsv(formData: FormData) {
  if (isEphemeralServerlessDatabase()) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      message:
        "Import refusé : Turso n'est pas configuré sur Vercel.\nLes données seraient perdues au prochain redémarrage. Ajoute l'intégration Turso puis redeploie.",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, imported: 0, skipped: 0, message: "Aucun fichier sélectionné." };
  }

  const keepExisting = formData.get("keepExisting") === "on";
  const replaceExisting = !keepExisting;

  const buffer = Buffer.from(await file.arrayBuffer());
  const content = decodeBankFile(buffer);
  const { transactions: parsed, errors } = parseBankCsv(content);

  if (errors.length > 0) {
    return { success: false, imported: 0, skipped: 0, message: errors.join("\n") };
  }

  if (parsed.length === 0) {
    return { success: false, imported: 0, skipped: 0, message: "Aucune transaction détectée." };
  }

  const db = await getDb();

  const allCategories = await db.select().from(categories);
  const rules = await db.select().from(categoryRules);
  const userRules = rules
    .map((r) => ({
      keyword: r.keyword,
      categoryName: allCategories.find((c) => c.id === r.categoryId)?.name ?? "",
    }))
    .filter((r) => r.categoryName);

  const existingRefs = replaceExisting
    ? new Set<string>()
    : new Set(
        (await db.select({ ref: transactions.bankReference }).from(transactions))
          .map((t) => t.ref)
          .filter((ref): ref is string => Boolean(ref)),
      );

  const rowsToInsert: Array<{
    date: string;
    label: string;
    amount: number;
    type: "expense" | "income";
    categoryId: number | null;
    source: "import";
    bankReference: string | null;
    createdAt: string;
  }> = [];

  let skipped = 0;
  const createdAt = new Date().toISOString();

  for (const tx of parsed as ParsedRow[]) {
    if (tx.bankReference && existingRefs.has(tx.bankReference)) {
      skipped++;
      continue;
    }

    const categoryName = guessCategory(tx.label, tx.amount, userRules);
    const category =
      allCategories.find((c) => c.name === categoryName) ??
      allCategories.find((c) => c.type === tx.type);

    rowsToInsert.push({
      date: tx.date,
      label: tx.label,
      amount: tx.amount,
      type: tx.type,
      categoryId: category?.id ?? null,
      source: "import",
      bankReference: tx.bankReference ?? null,
      createdAt,
    });

    if (tx.bankReference) existingRefs.add(tx.bankReference);
  }

  if (rowsToInsert.length === 0 && skipped > 0) {
    return {
      success: true,
      imported: 0,
      skipped,
      replaced: false,
      alreadyImported: true,
      message: buildImportMessage(0, skipped, parsed.length, false),
    };
  }

  if (rowsToInsert.length === 0) {
    return { success: false, imported: 0, skipped: 0, message: "Aucune transaction à enregistrer." };
  }

  try {
    await db.transaction(async (tx) => {
      if (replaceExisting) {
        await tx.delete(transactions).where(eq(transactions.source, "import"));
      }

      for (let i = 0; i < rowsToInsert.length; i += INSERT_BATCH) {
        const batch = rowsToInsert.slice(i, i + INSERT_BATCH);
        await tx.insert(transactions).values(batch);
      }
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      imported: 0,
      skipped: 0,
      message: `Échec de l'import — aucune donnée n'a été supprimée.\n${detail}`,
    };
  }

  const [verify] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(eq(transactions.source, "import"));

  const totalInDb = Number(verify?.count ?? 0);
  if (totalInDb === 0 && rowsToInsert.length > 0) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      message:
        "Import terminé mais 0 ligne en base — vérifie Turso (URL + token) et réessaie.",
    };
  }

  await recordSuccessfulImport(db);
  checkpointDatabase();
  revalidateImportPaths();

  const imported = rowsToInsert.length;

  return {
    success: true,
    imported,
    skipped,
    replaced: replaceExisting && imported > 0,
    alreadyImported: imported === 0 && skipped > 0,
    message: buildImportMessage(imported, skipped, parsed.length, replaceExisting && imported > 0),
  };
}
