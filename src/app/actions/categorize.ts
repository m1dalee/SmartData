"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { categorizeSimilarPayments } from "@/app/actions/transactions";
import { getDb } from "@/lib/db";
import { categories, transactions } from "@/lib/db/schema";
import { isFallbackCategory, lookupPaymentCategory, delay, PROVIDER_LABELS } from "@/lib/import/payment-lookup";
import { isMoneyMovement, MONEY_MOVEMENT_CATEGORY } from "@/lib/import/transfer-detector";

async function getCategoryByName(name: string) {
  const db = getDb();
  const [cat] = await db.select().from(categories).where(eq(categories.name, name)).limit(1);
  return cat ?? null;
}

async function applyCategoryToTransaction(
  transactionId: number,
  categoryId: number,
  keyword: string,
  saveRule: boolean,
) {
  const db = getDb();
  await db.update(transactions).set({ categoryId }).where(eq(transactions.id, transactionId));

  if (saveRule && keyword.trim()) {
    await categorizeSimilarPayments(keyword, categoryId, true);
  }
}

export async function identifySingleTransaction(transactionId: number) {
  const db = getDb();
  const [tx] = await db.select().from(transactions).where(eq(transactions.id, transactionId)).limit(1);
  if (!tx) return { success: false, message: "Transaction introuvable." };

  if (isMoneyMovement(tx.label)) {
    const cat = await getCategoryByName(MONEY_MOVEMENT_CATEGORY);
    if (cat) {
      await applyCategoryToTransaction(tx.id, cat.id, "virement", false);
      revalidatePath("/");
      revalidatePath("/transactions");
      return { success: true, categoryName: MONEY_MOVEMENT_CATEGORY, source: "Virement détecté" };
    }
  }

  const lookup = await lookupPaymentCategory(tx.label);
  if (!lookup) {
    return { success: false, message: `Impossible d'identifier « ${tx.label.slice(0, 40)} »` };
  }

  const cat = await getCategoryByName(lookup.categoryName);
  if (!cat) return { success: false, message: "Catégorie introuvable." };

  await applyCategoryToTransaction(tx.id, cat.id, lookup.keyword, true);

  revalidatePath("/");
  revalidatePath("/transactions");

  return {
    success: true,
    categoryName: lookup.categoryName,
    keyword: lookup.keyword,
    source: lookup.source,
    provider: lookup.provider,
    confidence: lookup.confidence,
  };
}

export async function identifyUnknownPayments(batchSize = 15) {
  const db = getDb();
  const allCategories = await db.select().from(categories);
  const fallbackIds = allCategories
    .filter((c) => isFallbackCategory(c.name))
    .map((c) => c.id);

  const allTx = await db.select().from(transactions);
  const unknown = allTx.filter((tx) => !tx.categoryId || fallbackIds.includes(tx.categoryId));

  const batch = unknown.slice(0, batchSize);
  let identified = 0;
  let failed = 0;
  const results: string[] = [];

  for (const tx of batch) {
    if (isMoneyMovement(tx.label)) {
      const cat = await getCategoryByName(MONEY_MOVEMENT_CATEGORY);
      if (cat) {
        await db.update(transactions).set({ categoryId: cat.id }).where(eq(transactions.id, tx.id));
        identified++;
        results.push(`✓ ${tx.label.slice(0, 35)} → Mouvement d'argent`);
        continue;
      }
    }

    const lookup = await lookupPaymentCategory(tx.label);
    if (lookup) {
      const cat = allCategories.find((c) => c.name === lookup.categoryName);
      if (cat) {
        await applyCategoryToTransaction(tx.id, cat.id, lookup.keyword, true);
        identified++;
        results.push(
          `✓ ${tx.label.slice(0, 35)} → ${lookup.categoryName} (${PROVIDER_LABELS[lookup.provider]})`,
        );
        await delay(250);
        continue;
      }
    }

    failed++;
    results.push(`✗ ${tx.label.slice(0, 35)} — aucun résultat (Wikipedia/Bing)`);
    await delay(150);
  }

  revalidatePath("/");
  revalidatePath("/transactions");

  const remaining = unknown.length - batch.length;

  return {
    success: true,
    identified,
    failed,
    remaining,
    total: unknown.length,
    message:
      `${identified} identifié(s), ${failed} échec(s).` +
      (remaining > 0 ? ` ${remaining} restant(s) — relancez pour continuer.` : ""),
    details: results,
  };
}

export async function recategorizeMoneyMovements() {
  const db = getDb();
  const cat = await getCategoryByName(MONEY_MOVEMENT_CATEGORY);
  if (!cat) return { updated: 0, message: "Catégorie introuvable." };

  const all = await db.select().from(transactions);
  let updated = 0;

  for (const tx of all) {
    if (isMoneyMovement(tx.label)) {
      await db.update(transactions).set({ categoryId: cat.id }).where(eq(transactions.id, tx.id));
      updated++;
    }
  }

  revalidatePath("/");
  revalidatePath("/transactions");

  return { updated, message: `${updated} virement(s) classé(s) en Mouvement d'argent.` };
}

export async function getUnknownPaymentCount() {
  const db = getDb();
  const allCategories = await db.select().from(categories);
  const fallbackIds = new Set(
    allCategories.filter((c) => isFallbackCategory(c.name)).map((c) => c.id),
  );

  const all = await db.select({ categoryId: transactions.categoryId }).from(transactions);
  return all.filter((t) => !t.categoryId || fallbackIds.has(t.categoryId)).length;
}
