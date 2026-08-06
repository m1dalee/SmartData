"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { checkpointDatabase, getDb } from "@/lib/db";
import { categories, categoryRules, transactions } from "@/lib/db/schema";
import { guessCategory } from "@/lib/import/category-matcher";
import { decodeBankFile, parseBankCsv } from "@/lib/import/csv-parser";

function buildImportMessage(imported: number, skipped: number, total: number, replaced: boolean): string {
  if (imported === 0 && skipped > 0) {
    return `Toutes les ${skipped} transactions sont déjà en base.\nRien n'a été modifié — vos données restent enregistrées.`;
  }
  if (imported > 0 && skipped === 0) {
    return replaced
      ? `${imported} transaction(s) enregistrée(s). L'ancien import a été remplacé.\nElles restent en base jusqu'au prochain CSV.`
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
  const db = getDb();
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(eq(transactions.source, "import"));
  return { importedCount: result?.count ?? 0 };
}

export async function clearImportedTransactions() {
  const db = getDb();
  const deleted = await db.delete(transactions).where(eq(transactions.source, "import"));
  checkpointDatabase();
  revalidateImportPaths();

  return {
    success: true,
    message: "Imports bancaires supprimés. La base est vide — importez un nouveau CSV pour recommencer.",
    deletedCount: deleted.changes ?? 0,
  };
}

export async function importBankCsv(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, imported: 0, skipped: 0, message: "Aucun fichier sélectionné." };
  }

  // Default: replace previous bank import (CSV stays until the next update).
  // Opt-in append via keepExisting.
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

  const db = getDb();

  if (replaceExisting) {
    await db.delete(transactions).where(eq(transactions.source, "import"));
  }

  const allCategories = await db.select().from(categories);
  const rules = await db.select().from(categoryRules);
  const userRules = rules
    .map((r) => ({
      keyword: r.keyword,
      categoryName: allCategories.find((c) => c.id === r.categoryId)?.name ?? "",
    }))
    .filter((r) => r.categoryName);

  const existingRefs = new Set(
    (await db.select({ ref: transactions.bankReference }).from(transactions))
      .map((t) => t.ref)
      .filter(Boolean),
  );

  let imported = 0;
  let skipped = 0;

  for (const tx of parsed) {
    if (tx.bankReference && existingRefs.has(tx.bankReference)) {
      skipped++;
      continue;
    }

    const categoryName = guessCategory(tx.label, tx.amount, userRules);
    const category =
      allCategories.find((c) => c.name === categoryName) ??
      allCategories.find((c) => c.type === tx.type);

    await db.insert(transactions).values({
      date: tx.date,
      label: tx.label,
      amount: tx.amount,
      type: tx.type,
      categoryId: category?.id ?? null,
      source: "import",
      bankReference: tx.bankReference,
      createdAt: new Date().toISOString(),
    });

    if (tx.bankReference) existingRefs.add(tx.bankReference);
    imported++;
  }

  checkpointDatabase();
  revalidateImportPaths();

  return {
    success: true,
    imported,
    skipped,
    replaced: replaceExisting && imported > 0,
    alreadyImported: imported === 0 && skipped > 0,
    message: buildImportMessage(imported, skipped, parsed.length, replaceExisting && imported > 0),
  };
}
