import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { savingsGoals, transactions } from "@/lib/db/schema";
import { getCurrentMonth, getMonthRange } from "@/lib/format";
import { MAIN_SAVINGS_GOAL } from "@/lib/savings-goal-constants";

/** Épargne = revenus − dépenses sur la période */
export function computeSavingsFromTransactions(
  allTransactions: { amount: number; type: string; date?: string }[],
  sinceMonth?: string,
): number {
  const filtered = sinceMonth
    ? allTransactions.filter((t) => t.date && t.date >= getMonthRange(sinceMonth).start)
    : allTransactions;

  const income = filtered
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = filtered
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return income - expenses;
}

export function computeMonthlySavings(
  allTransactions: { amount: number; type: string; date: string }[],
  month: string,
): number {
  const { start, end } = getMonthRange(month);
  const txs = allTransactions.filter((t) => t.date >= start && t.date <= end);
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
};

export async function syncMainGoalWithSavings(): Promise<MainGoalSnapshot> {
  await ensureMainSavingsGoal();

  const db = getDb();
  const [goal] = await db
    .select()
    .from(savingsGoals)
    .where(eq(savingsGoals.name, MAIN_SAVINGS_GOAL.name))
    .limit(1);

  const allTransactions = await db.select().from(transactions);
  const startingAmount = goal?.startingAmount ?? 0;

  // Épargne depuis le début du suivi (import) + épargne déjà acquise
  const periodSavings = computeSavingsFromTransactions(allTransactions);
  const currentAmount = startingAmount + periodSavings;

  const monthlySavings = computeMonthlySavings(allTransactions, getCurrentMonth());

  await db
    .update(savingsGoals)
    .set({ currentAmount })
    .where(eq(savingsGoals.name, MAIN_SAVINGS_GOAL.name));

  const displayAmount = Math.max(0, currentAmount);
  const progress = Math.min(100, (displayAmount / MAIN_SAVINGS_GOAL.targetAmount) * 100);
  const remaining = Math.max(0, MAIN_SAVINGS_GOAL.targetAmount - displayAmount);

  return {
    currentAmount: displayAmount,
    targetAmount: MAIN_SAVINGS_GOAL.targetAmount,
    progress,
    remaining,
    startingAmount,
    periodSavings,
    monthlySavings,
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

/** L'utilisateur indique son épargne totale actuelle ; on en déduit le point de départ. */
export async function updateMainGoalTotalSavings(totalSavings: number) {
  await ensureMainSavingsGoal();

  const db = getDb();
  const allTransactions = await db.select().from(transactions);
  const periodSavings = computeSavingsFromTransactions(allTransactions);
  const startingAmount = Math.max(0, totalSavings - periodSavings);

  await db
    .update(savingsGoals)
    .set({ startingAmount })
    .where(eq(savingsGoals.name, MAIN_SAVINGS_GOAL.name));

  return syncMainGoalWithSavings();
}
