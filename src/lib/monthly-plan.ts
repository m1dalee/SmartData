import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { categories, transactions, userSettings } from "@/lib/db/schema";
import { getMonthRange } from "@/lib/format";
import {
  countTransfers,
  filterRealTransactions,
  sumRealExpenses,
  sumRealIncome,
  type TransactionWithCategory,
} from "@/lib/transaction-filters";

export type MonthlyPlan = {
  month: string;
  income: number;
  expenses: number;
  transfersExcluded: number;
  monthlySavingsTarget: number;
  /** Revenus − objectif épargne − dépenses (budget plaisirs restant). */
  pleasuresRemaining: number;
  /** Revenus − dépenses (épargne réelle du mois). */
  actualSavings: number;
  /** Objectif atteint si actualSavings >= monthlySavingsTarget. */
  savingsTargetMet: boolean;
  /** Dépassement si pleasuresRemaining < 0. */
  isOverBudget: boolean;
};

async function loadTransactionsWithCategories(): Promise<TransactionWithCategory[]> {
  const db = getDb();
  const rows = await db
    .select({
      amount: transactions.amount,
      type: transactions.type,
      label: transactions.label,
      date: transactions.date,
      categoryName: categories.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id));

  return rows.map((row) => ({
    ...row,
    type: row.type as "expense" | "income",
  }));
}

export async function ensureUserSettings() {
  const db = getDb();
  const existing = await db.select().from(userSettings).limit(1);
  if (existing.length === 0) {
    await db.insert(userSettings).values({
      monthlySavingsTarget: 0,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function getMonthlySavingsTarget(): Promise<number> {
  await ensureUserSettings();
  const db = getDb();
  const [settings] = await db.select().from(userSettings).limit(1);
  return settings?.monthlySavingsTarget ?? 0;
}

export async function setMonthlySavingsTarget(amount: number): Promise<number> {
  await ensureUserSettings();
  const db = getDb();
  const safeAmount = Math.max(0, amount);
  await db
    .update(userSettings)
    .set({ monthlySavingsTarget: safeAmount, updatedAt: new Date().toISOString() });
  return safeAmount;
}

export async function getMonthlyPlan(month: string): Promise<MonthlyPlan> {
  const { start, end } = getMonthRange(month);
  const all = await loadTransactionsWithCategories();
  const monthTxs = all.filter((tx) => tx.date >= start && tx.date <= end);

  const income = sumRealIncome(monthTxs);
  const expenses = sumRealExpenses(monthTxs);
  const monthlySavingsTarget = await getMonthlySavingsTarget();
  const pleasuresRemaining = income - monthlySavingsTarget - expenses;
  const actualSavings = income - expenses;

  return {
    month,
    income,
    expenses,
    transfersExcluded: countTransfers(monthTxs),
    monthlySavingsTarget,
    pleasuresRemaining,
    actualSavings,
    savingsTargetMet: actualSavings >= monthlySavingsTarget,
    isOverBudget: pleasuresRemaining < 0,
  };
}

/** Pour les graphiques : résumé mensuel hors virements. */
export function summarizeRealMonth(
  transactions: TransactionWithCategory[],
  month: string,
): { month: string; income: number; expenses: number; savings: number; savingsRate: number } {
  const { start, end } = getMonthRange(month);
  const monthTxs = transactions.filter((tx) => tx.date >= start && tx.date <= end);
  const real = filterRealTransactions(monthTxs);
  const income = sumRealIncome(real);
  const expenses = sumRealExpenses(real);
  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  return { month, income, expenses, savings, savingsRate };
}
