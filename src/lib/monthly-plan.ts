import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { categories, transactions, userSettings } from "@/lib/db/schema";
import { getMonthRange } from "@/lib/format";
import {
  formatPayCycleLabel,
  getNextPaydayInfo,
  getPayCycleRange,
} from "@/lib/pay-cycle";
import { computeBudgetExpenses, type EffectiveExpenses } from "@/lib/expense-attribution";
import {
  countTransfers,
  filterRealTransactions,
  sumRealIncome,
  type TransactionWithCategory,
} from "@/lib/transaction-filters";

export const DEFAULT_BUDGET = {
  monthlySalaryNet: 1830,
  mealVoucherAmount: 160,
  monthlySavingsTarget: 1500,
  paydayStartDay: 3,
  paydayEndDay: 5,
} as const;

export type BudgetSettings = {
  monthlySalaryNet: number;
  mealVoucherAmount: number;
  monthlySavingsTarget: number;
  paydayStartDay: number;
  paydayEndDay: number;
  provisionalCardSpending: number | null;
};

export type MonthlyPlan = {
  month: string;
  payCycleStart: string;
  payCycleEnd: string;
  payCycleLabel: string;
  paydayStartDay: number;
  paydayEndDay: number;
  daysUntilPayday: number;
  nextPaydayLabel: string;
  isPaydayWindow: boolean;
  monthlySalaryNet: number;
  mealVoucherAmount: number;
  totalMonthlyIncome: number;
  monthlySavingsTarget: number;
  spendingEnvelope: number;
  expenses: number;
  incomeFromBank: number;
  transfersExcluded: number;
  remainingBeforePayday: number;
  actualSavingsFromBank: number;
  isOverBudget: boolean;
  cardSpending: EffectiveExpenses;
};

async function loadTransactionsWithCategories(): Promise<TransactionWithCategory[]> {
  const db = await getDb();
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
  const db = await getDb();
  const existing = await db.select().from(userSettings).limit(1);
  if (existing.length === 0) {
    await db.insert(userSettings).values({
      monthlySalaryNet: DEFAULT_BUDGET.monthlySalaryNet,
      mealVoucherAmount: DEFAULT_BUDGET.mealVoucherAmount,
      monthlySavingsTarget: DEFAULT_BUDGET.monthlySavingsTarget,
      paydayStartDay: DEFAULT_BUDGET.paydayStartDay,
      paydayEndDay: DEFAULT_BUDGET.paydayEndDay,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function getBudgetSettings(): Promise<BudgetSettings> {
  await ensureUserSettings();
  const db = await getDb();
  const [settings] = await db.select().from(userSettings).limit(1);
  return {
    monthlySalaryNet: settings?.monthlySalaryNet ?? DEFAULT_BUDGET.monthlySalaryNet,
    mealVoucherAmount: settings?.mealVoucherAmount ?? DEFAULT_BUDGET.mealVoucherAmount,
    monthlySavingsTarget: settings?.monthlySavingsTarget ?? DEFAULT_BUDGET.monthlySavingsTarget,
    paydayStartDay: settings?.paydayStartDay ?? DEFAULT_BUDGET.paydayStartDay,
    paydayEndDay: settings?.paydayEndDay ?? DEFAULT_BUDGET.paydayEndDay,
    provisionalCardSpending: settings?.provisionalCardSpending ?? null,
  };
}

export async function updateBudgetSettings(settings: BudgetSettings): Promise<BudgetSettings> {
  await ensureUserSettings();
  const db = await getDb();
  const safe: BudgetSettings = {
    monthlySalaryNet: Math.max(0, settings.monthlySalaryNet),
    mealVoucherAmount: Math.max(0, settings.mealVoucherAmount),
    monthlySavingsTarget: Math.max(0, settings.monthlySavingsTarget),
    paydayStartDay: Math.min(28, Math.max(1, Math.round(settings.paydayStartDay))),
    paydayEndDay: Math.min(28, Math.max(1, Math.round(settings.paydayEndDay))),
    provisionalCardSpending:
      settings.provisionalCardSpending != null
        ? Math.max(0, settings.provisionalCardSpending)
        : null,
  };
  if (safe.paydayEndDay < safe.paydayStartDay) {
    safe.paydayEndDay = safe.paydayStartDay;
  }
  await db.update(userSettings).set({
    ...safe,
    updatedAt: new Date().toISOString(),
  });
  return safe;
}

export async function setMonthlySavingsTarget(amount: number): Promise<number> {
  const current = await getBudgetSettings();
  await updateBudgetSettings({ ...current, monthlySavingsTarget: amount });
  return amount;
}

/** Budget du cycle de paye en cours (pas le mois calendaire). */
export async function getMonthlyPlan(referenceDate: Date = new Date()): Promise<MonthlyPlan> {
  const settings = await getBudgetSettings();
  const payCycle = getPayCycleRange(referenceDate, settings.paydayStartDay);
  const paydayInfo = getNextPaydayInfo(
    referenceDate,
    settings.paydayStartDay,
    settings.paydayEndDay,
  );

  const all = await loadTransactionsWithCategories();
  const cycleTxs = all.filter((tx) => tx.date >= payCycle.start && tx.date <= payCycle.end);
  const realCycleTxs = filterRealTransactions(cycleTxs);

  const calendarMonth = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, "0")}`;
  const calendarRange = getMonthRange(calendarMonth);

  const totalMonthlyIncome = settings.monthlySalaryNet + settings.mealVoucherAmount;
  const spendingEnvelope = totalMonthlyIncome - settings.monthlySavingsTarget;
  const cardSpending = computeBudgetExpenses(
    all,
    payCycle.start,
    payCycle.end,
    calendarRange.start,
    calendarRange.end,
    { manualCardSpending: settings.provisionalCardSpending },
  );
  const expenses = cardSpending.total;
  const incomeFromBank = sumRealIncome(realCycleTxs);
  const remainingBeforePayday = spendingEnvelope - expenses;

  return {
    month: payCycle.cycleKey,
    payCycleStart: payCycle.start,
    payCycleEnd: payCycle.end,
    payCycleLabel: formatPayCycleLabel(payCycle.start, payCycle.end),
    paydayStartDay: settings.paydayStartDay,
    paydayEndDay: settings.paydayEndDay,
    daysUntilPayday: paydayInfo.daysUntilStart,
    nextPaydayLabel: paydayInfo.label,
    isPaydayWindow: paydayInfo.isPaydayWindow,
    monthlySalaryNet: settings.monthlySalaryNet,
    mealVoucherAmount: settings.mealVoucherAmount,
    totalMonthlyIncome,
    monthlySavingsTarget: settings.monthlySavingsTarget,
    spendingEnvelope,
    expenses,
    incomeFromBank,
    transfersExcluded: countTransfers(cycleTxs),
    remainingBeforePayday,
    actualSavingsFromBank: incomeFromBank - expenses,
    isOverBudget: remainingBeforePayday < 0,
    cardSpending,
  };
}

/** Pour les graphiques : résumé mensuel calendaire hors virements. */
export function summarizeRealMonth(
  transactions: TransactionWithCategory[],
  month: string,
  manualCardSpending?: number | null,
  isCurrentMonth = false,
): { month: string; income: number; expenses: number; savings: number; savingsRate: number } {
  const { start, end } = getMonthRange(month);
  const monthTxs = transactions.filter((tx) => tx.date >= start && tx.date <= end);
  const real = filterRealTransactions(monthTxs);
  const income = sumRealIncome(real);
  const effective = computeBudgetExpenses(transactions, start, end, start, end, {
    manualCardSpending: isCurrentMonth ? manualCardSpending : null,
  });
  const expenses = effective.total;
  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  return { month, income, expenses, savings, savingsRate };
}
