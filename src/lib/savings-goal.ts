import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { categories, savingsGoals, transactions, userSettings } from "@/lib/db/schema";
import { getCurrentMonth, getMonthRange } from "@/lib/format";
import { buildSelfSavingsNamesFromTransactions, isSavingsTransfer } from "@/lib/import/savings-transfer-detector";
import {
  isSelfSavingsIncoming,
  isSelfSavingsOutgoing,
  sumSelfSavingsMovements,
} from "@/lib/import/self-savings-detector";
import { isTransferTransaction } from "@/lib/transaction-filters";
import { MAIN_SAVINGS_GOAL } from "@/lib/savings-goal-constants";

type SavingsTransaction = {
  amount: number;
  type: string;
  date?: string;
  label?: string;
  categoryName?: string | null;
};

/**
 * Épargne cumulée sur la période :
 * revenus − dépenses réelles + virements Livret (WEB/DE MONSIEUR …).
 */
export function computeSavingsFromTransactions(
  allTransactions: SavingsTransaction[],
  sinceMonth?: string,
): number {
  const selfSavingsNames = buildSelfSavingsNamesFromTransactions(allTransactions);

  const filtered = sinceMonth
    ? allTransactions.filter((t) => t.date && t.date >= getMonthRange(sinceMonth).start)
    : allTransactions;

  let income = 0;
  let expenses = 0;
  let savingsTransfers = 0;

  for (const tx of filtered) {
    const row = {
      label: tx.label ?? "",
      categoryName: tx.categoryName,
    };
    const amount = Math.abs(tx.amount);

    if (isSelfSavingsOutgoing(tx.label ?? "", selfSavingsNames)) {
      savingsTransfers += amount;
      continue;
    }

    if (isSelfSavingsIncoming(tx.label ?? "", selfSavingsNames)) {
      savingsTransfers -= amount;
      continue;
    }

    if (isTransferTransaction(row, selfSavingsNames)) continue;

    if (tx.type === "income") {
      income += tx.amount;
      continue;
    }

    if (isSavingsTransfer(tx.label ?? "", selfSavingsNames)) {
      savingsTransfers += amount;
    } else {
      expenses += amount;
    }
  }

  return income - expenses + savingsTransfers;
}

export function computeMonthlySavings(
  allTransactions: SavingsTransaction[],
  month: string,
): number {
  const { start, end } = getMonthRange(month);
  const txs = allTransactions.filter((t) => t.date && t.date >= start && t.date <= end);
  return computeSavingsFromTransactions(txs);
}

export async function ensureMainSavingsGoal() {
  const db = getDb();
  const existing = await db
    .select()
    .from(savingsGoals)
    .where(eq(savingsGoals.name, MAIN_SAVINGS_GOAL.name))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(savingsGoals).values({
      name: MAIN_SAVINGS_GOAL.name,
      targetAmount: MAIN_SAVINGS_GOAL.targetAmount,
      currentAmount: 0,
      startingAmount: 0,
      deadline: null,
    });
  }
}

export type MainGoalSnapshot = {
  currentAmount: number;
  targetAmount: number;
  progress: number;
  remaining: number;
  startingAmount: number;
  periodSavings: number;
  monthlySavings: number;
  savingsTransfersInPeriod: number;
  livretDeposits: number;
  livretWithdrawals: number;
  livretNetInPeriod: number;
  needsBaseline: boolean;
};

async function loadTransactionsForSavings() {
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

function sumSavingsTransfers(allTransactions: SavingsTransaction[]): number {
  const selfSavingsNames = buildSelfSavingsNamesFromTransactions(allTransactions);
  const { deposits } = sumSelfSavingsMovements(allTransactions, selfSavingsNames);

  const keywordTransfers = allTransactions
    .filter(
      (tx) =>
        tx.type === "expense" &&
        isSavingsTransfer(tx.label ?? "", selfSavingsNames) &&
        !isSelfSavingsOutgoing(tx.label ?? "", selfSavingsNames),
    )
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  return deposits + keywordTransfers;
}

async function getStoredTotalSavings(): Promise<number | null> {
  const db = getDb();
  const [settings] = await db.select().from(userSettings).limit(1);
  return settings?.totalSavingsBalance ?? null;
}

export async function syncMainGoalWithSavings(): Promise<MainGoalSnapshot> {
  await ensureMainSavingsGoal();

  const db = getDb();
  const [goal] = await db
    .select()
    .from(savingsGoals)
    .where(eq(savingsGoals.name, MAIN_SAVINGS_GOAL.name))
    .limit(1);

  const allTransactions = await loadTransactionsForSavings();
  const selfSavingsNames = buildSelfSavingsNamesFromTransactions(allTransactions);
  const livretMovements = sumSelfSavingsMovements(allTransactions, selfSavingsNames);
  const storedTotal = await getStoredTotalSavings();

  const periodSavings = computeSavingsFromTransactions(allTransactions);
  const savingsTransfersInPeriod = sumSavingsTransfers(allTransactions);
  const monthlySavings = computeMonthlySavings(allTransactions, getCurrentMonth());

  let startingAmount = goal?.startingAmount ?? 0;

  if (storedTotal !== null) {
    const expectedStarting = Math.max(0, storedTotal - periodSavings);
    if (Math.abs(startingAmount - expectedStarting) > 0.01) {
      startingAmount = expectedStarting;
      await db
        .update(savingsGoals)
        .set({ startingAmount })
        .where(eq(savingsGoals.name, MAIN_SAVINGS_GOAL.name));
    }
  }

  const currentAmount = startingAmount + periodSavings;

  await db
    .update(savingsGoals)
    .set({ currentAmount })
    .where(eq(savingsGoals.name, MAIN_SAVINGS_GOAL.name));

  const displayAmount = Math.max(0, currentAmount);
  const progress = Math.min(100, (displayAmount / MAIN_SAVINGS_GOAL.targetAmount) * 100);
  const remaining = Math.max(0, MAIN_SAVINGS_GOAL.targetAmount - displayAmount);
  const needsBaseline =
    startingAmount === 0 &&
    storedTotal === null &&
    livretMovements.deposits > 0 &&
    displayAmount < livretMovements.deposits * 0.5;

  return {
    currentAmount: displayAmount,
    targetAmount: MAIN_SAVINGS_GOAL.targetAmount,
    progress,
    remaining,
    startingAmount,
    periodSavings,
    monthlySavings,
    savingsTransfersInPeriod,
    livretDeposits: livretMovements.deposits,
    livretWithdrawals: livretMovements.withdrawals,
    livretNetInPeriod: livretMovements.net,
    needsBaseline,
  };
}

export async function updateMainGoalStartingAmount(startingAmount: number) {
  await ensureMainSavingsGoal();
  const db = getDb();
  await db
    .update(savingsGoals)
    .set({ startingAmount: Math.max(0, startingAmount) })
    .where(eq(savingsGoals.name, MAIN_SAVINGS_GOAL.name));

  return syncMainGoalWithSavings();
}

/** L'utilisateur indique son épargne totale actuelle (Livret + LDD…) ; on en déduit le point de départ. */
export async function updateMainGoalTotalSavings(totalSavings: number) {
  await ensureMainSavingsGoal();

  const db = getDb();
  const allTransactions = await loadTransactionsForSavings();
  const periodSavings = computeSavingsFromTransactions(allTransactions);
  const startingAmount = Math.max(0, totalSavings - periodSavings);

  await db
    .update(savingsGoals)
    .set({ startingAmount, currentAmount: totalSavings })
    .where(eq(savingsGoals.name, MAIN_SAVINGS_GOAL.name));

  const [existingSettings] = await db.select().from(userSettings).limit(1);
  if (existingSettings) {
    await db
      .update(userSettings)
      .set({
        totalSavingsBalance: totalSavings,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(userSettings.id, existingSettings.id));
  } else {
    await db.insert(userSettings).values({
      totalSavingsBalance: totalSavings,
      updatedAt: new Date().toISOString(),
    });
  }

  return syncMainGoalWithSavings();
}
