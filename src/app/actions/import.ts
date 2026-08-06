"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { categories, categoryRules, transactions } from "@/lib/db/schema";
import { guessCategory } from "@/lib/import/category-matcher";
import { decodeBankFile, parseBankCsv } from "@/lib/import/csv-parser";

function buildImportMessage(imported: number, skipped: number, total: number): string {
  if (imported === 0 && skipped > 0) {
    return `Toutes les ${skipped} transactions sont déjà importées.\nConsultez le Tableau de bord ou Transactions.\nSi les données semblent incorrectes, supprimez les imports et réessayez.`;
  }
  if (imported > 0 && skipped === 0) {
    return `${imported} transaction(s) importée(s) avec succès.`;
  }
  if (imported > 0 && skipped > 0) {
    return `${imported} transaction(s) importée(s), ${skipped} déjà présente(s) (ignorées).`;
  }
  return `Aucune nouvelle transaction sur ${total} ligne(s) analysée(s).`;
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

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/import");

  return {
    success: true,
    message: "Transactions bancaires importées supprimées. Vous pouvez réimporter votre CSV.",
    deletedCount: deleted.changes ?? 0,
  };
}

export async function importBankCsv(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, imported: 0, skipped: 0, message: "Aucun fichier sélectionné." };
  }

  const replaceExisting = formData.get("replaceExisting") === "on";

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

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/import");

  return {
    success: true,
    imported,
    skipped,
    alreadyImported: imported === 0 && skipped > 0,
    message: buildImportMessage(imported, skipped, parsed.length),
  };
}
