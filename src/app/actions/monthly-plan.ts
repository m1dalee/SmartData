"use server";

import { revalidatePath } from "next/cache";
import { getBudgetSettings, updateBudgetSettings } from "@/lib/monthly-plan";

function parseAmount(raw: FormDataEntryValue | null): number | null {
  const amount = Number.parseFloat(String(raw ?? ""));
  if (Number.isNaN(amount) || amount < 0) return null;
  return amount;
}

export async function updateMonthlyBudgetSettings(formData: FormData) {
  const monthlySalaryNet = parseAmount(formData.get("monthlySalaryNet"));
  const mealVoucherAmount = parseAmount(formData.get("mealVoucherAmount"));
  const monthlySavingsTarget = parseAmount(formData.get("monthlySavingsTarget"));

  if (
    monthlySalaryNet === null ||
    mealVoucherAmount === null ||
    monthlySavingsTarget === null
  ) {
    return { success: false, message: "Montants invalides." };
  }

  if (monthlySavingsTarget > monthlySalaryNet + mealVoucherAmount) {
    return {
      success: false,
      message: "L'objectif d'épargne ne peut pas dépasser vos revenus mensuels.",
    };
  }

  await updateBudgetSettings({ monthlySalaryNet, mealVoucherAmount, monthlySavingsTarget });

  revalidatePath("/");
  revalidatePath("/budgets");

  return { success: true, message: "Budget mensuel mis à jour." };
}

export async function updateMonthlySavingsTarget(formData: FormData) {
  const amount = parseAmount(formData.get("monthlySavingsTarget"));
  if (amount === null) return { success: false, message: "Montant invalide." };

  const current = await getBudgetSettings();
  await updateBudgetSettings({ ...current, monthlySavingsTarget: amount });

  revalidatePath("/");
  revalidatePath("/budgets");

  return {
    success: true,
    message: `Objectif d'épargne mensuel fixé à ${amount.toLocaleString("fr-FR")} €.`,
  };
}
