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

export const DEFAULT_BUDGET = {
  monthlySalaryNet: 1830,
  mealVoucherAmount: 160,
  monthlySavingsTarget: 1500,
} as const;

export type BudgetSettings = {
  monthlySalaryNet: number;
  mealVoucherAmount: number;
  monthlySavingsTarget: number;
};

export type MonthlyPlan = {
  month: string;
  /** Salaire net configuré (ex. 1 830 €). */
  monthlySalaryNet: number;
  /** Tickets resto configurés (ex. 160 €). */
  mealVoucherAmount: number;
  /** Total revenus prévus = salaire + tickets. */
  totalMonthlyIncome: number;
  /** Objectif épargne réservé (ex. 1 500 €). */
  monthlySavingsTarget: number;
  /** Enveloppe dépenses = revenus − épargne (ex. 490 €). */
  spendingEnvelope: number;
  /** Dépenses réelles du mois (hors virements). */
  expenses: number;
  /** Revenus réellement détectés dans les imports (info). */
  incomeFromBank: number;
  transfersExcluded: number;
  /** Il reste X € avant la prochaine paye. */
  remainingBeforePayday: number;
  /** Épargne réelle si on se base sur les entrées bancaires. */
  actualSavingsFromBank: number;
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
      monthlySalaryNet: DEFAULT_BUDGET.monthlySalaryNet,
      mealVoucherAmount: DEFAULT_BUDGET.mealVoucherAmount,
      monthlySavingsTarget: DEFAULT_BUDGET.monthlySavingsTarget,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function getBudgetSettings(): Promise<BudgetSettings> {
  await ensureUserSettings();
  const db = getDb();
  const [settings] = await db.select().from(userSettings).limit(1);
  return {
    monthlySalaryNet: settings?.monthlySalaryNet ?? DEFAULT_BUDGET.monthlySalaryNet,
    mealVoucherAmount: settings?.mealVoucherAmount ?? DEFAULT_BUDGET.mealVoucherAmount,
    monthlySavingsTarget: settings?.monthlySavingsTarget ?? DEFAULT_BUDGET.monthlySavingsTarget,
  };
}

export async function updateBudgetSettings(settings: BudgetSettings): Promise<BudgetSettings> {
  await ensureUserSettings();
  const db = getDb();
  const safe: BudgetSettings = {
    monthlySalaryNet: Math.max(0, settings.monthlySalaryNet),
    mealVoucherAmount: Math.max(0, settings.mealVoucherAmount),
    monthlySavingsTarget: Math.max(0, settings.monthlySavingsTarget),
  };
  await db.update(userSettings).set({
    ...safe,
    updatedAt: new Date().toISOString(),
  });
  return safe;
}

/** @deprecated use updateBudgetSettings */
export async function setMonthlySavingsTarget(amount: number): Promise<number> {
  const current = await getBudgetSettings();
  await updateBudgetSettings({ ...current, monthlySavingsTarget: amount });
  return amount;
}

export async function getMonthlyPlan(month: string): Promise<MonthlyPlan> {
  const { start, end } = getMonthRange(month);
  const all = await loadTransactionsWithCategories();
  const monthTxs = all.filter((tx) => tx.date >= start && tx.date <= end);
  const realMonthTxs = filterRealTransactions(monthTxs);

  const settings = await getBudgetSettings();
  const totalMonthlyIncome = settings.monthlySalaryNet + settings.mealVoucherAmount;
  const spendingEnvelope = totalMonthlyIncome - settings.monthlySavingsTarget;
  const expenses = sumRealExpenses(realMonthTxs);
  const incomeFromBank = sumRealIncome(realMonthTxs);
  const remainingBeforePayday = spendingEnvelope - expenses;

  return {
    month,
    monthlySalaryNet: settings.monthlySalaryNet,
    mealVoucherAmount: settings.mealVoucherAmount,
    totalMonthlyIncome,
    monthlySavingsTarget: settings.monthlySavingsTarget,
    spendingEnvelope,
    expenses,
    incomeFromBank,
    transfersExcluded: countTransfers(monthTxs),
    remainingBeforePayday,
    actualSavingsFromBank: incomeFromBank - expenses,
    isOverBudget: remainingBeforePayday < 0,
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
