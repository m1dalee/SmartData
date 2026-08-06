"use server";

import { desc, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { categories, categoryRules, transactions } from "@/lib/db/schema";
import { extractKeyword, labelMatchesKeyword } from "@/lib/import/label-utils";

export type TransactionRow = {
  transaction: {
    id: number;
    date: string;
    label: string;
    amount: number;
    type: "expense" | "income";
    source: "manual" | "import";
    categoryId: number | null;
  };
  category: { id: number; name: string; color: string } | null;
};

export async function getCategories() {
  const db = getDb();
  return db.select().from(categories).orderBy(categories.name);
}

export async function getTransactions(limit = 500): Promise<TransactionRow[]> {
  const db = getDb();
  return db
    .select({
      transaction: {
        id: transactions.id,
        date: transactions.date,
        label: transactions.label,
        amount: transactions.amount,
        type: transactions.type,
        source: transactions.source,
        categoryId: transactions.categoryId,
      },
      category: {
        id: categories.id,
        name: categories.name,
        color: categories.color,
      },
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .orderBy(desc(transactions.date), desc(transactions.id))
    .limit(limit);
}

export async function getUncategorizedCount() {
  const db = getDb();
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(isNull(transactions.categoryId));
  return result?.count ?? 0;
}

export async function createTransaction(formData: FormData) {
  const db = getDb();
  const date = String(formData.get("date"));
  const label = String(formData.get("label")).trim();
  const rawAmount = Number.parseFloat(String(formData.get("amount")));
  const type = String(formData.get("type")) as "expense" | "income";
  const categoryId = Number.parseInt(String(formData.get("categoryId")), 10);

  if (!date || !label || Number.isNaN(rawAmount) || !categoryId) {
    throw new Error("Données invalides");
  }

  const amount = type === "expense" ? -Math.abs(rawAmount) : Math.abs(rawAmount);

  await db.insert(transactions).values({
    date,
    label,
    amount,
    type,
    categoryId,
    source: "manual",
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/");
  revalidatePath("/transactions");
}

export async function updateTransactionCategory(transactionId: number, categoryId: number) {
  const db = getDb();
  await db.update(transactions).set({ categoryId }).where(eq(transactions.id, transactionId));
  revalidatePath("/");
  revalidatePath("/transactions");
  return { success: true };
}

export async function countSimilarTransactions(keyword: string) {
  const db = getDb();
  const all = await db.select({ id: transactions.id, label: transactions.label }).from(transactions);
  return all.filter((t) => labelMatchesKeyword(t.label, keyword)).length;
}

export async function categorizeSimilarPayments(
  keyword: string,
  categoryId: number,
  saveRule = true,
) {
  const db = getDb();
  const all = await db.select().from(transactions);
  const matching = all.filter((t) => labelMatchesKeyword(t.label, keyword));

  for (const tx of matching) {
    await db.update(transactions).set({ categoryId }).where(eq(transactions.id, tx.id));
  }

  if (saveRule && keyword.trim()) {
    const normalizedKeyword = keyword.toLowerCase().trim();
    const existing = await db
      .select()
      .from(categoryRules)
      .where(eq(categoryRules.keyword, normalizedKeyword))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(categoryRules)
        .set({ categoryId })
        .where(eq(categoryRules.keyword, normalizedKeyword));
    } else {
      await db.insert(categoryRules).values({
        keyword: normalizedKeyword,
        categoryId,
        createdAt: new Date().toISOString(),
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/transactions");

  return { updated: matching.length };
}

export async function deleteTransaction(id: number) {
  const db = getDb();
  await db.delete(transactions).where(eq(transactions.id, id));
  revalidatePath("/");
  revalidatePath("/transactions");
}
