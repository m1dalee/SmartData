"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { budgets, savingsGoals } from "@/lib/db/schema";
import { getCurrentMonth } from "@/lib/format";
import { syncMainGoalWithSavings } from "@/lib/savings-goal";

export async function createSavingsGoal(formData: FormData) {
  const db = getDb();
  const name = String(formData.get("name")).trim();
  const targetAmount = Number.parseFloat(String(formData.get("targetAmount")));
  const currentAmount = Number.parseFloat(String(formData.get("currentAmount") || "0"));
  const deadline = String(formData.get("deadline") || "") || null;

  if (!name || Number.isNaN(targetAmount)) {
    throw new Error("Données invalides");
  }

  await db.insert(savingsGoals).values({
    name,
    targetAmount,
    currentAmount: Number.isNaN(currentAmount) ? 0 : currentAmount,
    startingAmount: 0,
    deadline,
  });

  revalidatePath("/");
  revalidatePath("/budgets");
}

export async function updateSavingsGoalProgress(id: number, currentAmount: number) {
  const db = getDb();
  await db.update(savingsGoals).set({ currentAmount }).where(eq(savingsGoals.id, id));
  revalidatePath("/");
  revalidatePath("/budgets");
}

export async function createBudget(formData: FormData) {
  const db = getDb();
  const categoryId = Number.parseInt(String(formData.get("categoryId")), 10);
  const amount = Number.parseFloat(String(formData.get("amount")));
  const month = String(formData.get("month") || getCurrentMonth());

  if (!categoryId || Number.isNaN(amount)) {
    throw new Error("Données invalides");
  }

  await db.insert(budgets).values({ categoryId, amount, month });
  revalidatePath("/");
  revalidatePath("/budgets");
}

export async function getSavingsGoals() {
  await syncMainGoalWithSavings();
  const db = getDb();
  return db.select().from(savingsGoals);
}

export async function getBudgets(month = getCurrentMonth()) {
  const db = getDb();
  return db.select().from(budgets).where(eq(budgets.month, month));
}
