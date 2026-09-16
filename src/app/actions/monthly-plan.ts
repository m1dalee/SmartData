"use server";

import { revalidatePath } from "next/cache";
import { getBudgetSettings, updateBudgetSettings } from "@/lib/monthly-plan";

function parseAmount(raw: FormDataEntryValue | null): number | null {
  const amount = Number.parseFloat(String(raw ?? ""));
  if (Number.isNaN(amount) || amount < 0) return null;
  return amount;
}

function parseDay(raw: FormDataEntryValue | null): number | null {
  const day = Number.parseInt(String(raw ?? ""), 10);
  if (Number.isNaN(day) || day < 1 || day > 28) return null;
  return day;
}

export async function updateMonthlyBudgetSettings(formData: FormData) {
  const monthlySalaryNet = parseAmount(formData.get("monthlySalaryNet"));
  const mealVoucherAmount = parseAmount(formData.get("mealVoucherAmount"));
  const monthlySavingsTarget = parseAmount(formData.get("monthlySavingsTarget"));
  const paydayStartDay = parseDay(formData.get("paydayStartDay"));
  const paydayEndDay = parseDay(formData.get("paydayEndDay"));
  const provisionalRaw = String(formData.get("provisionalCardSpending") ?? "").trim();
  const provisionalCardSpending =
    provisionalRaw === "" ? null : parseAmount(formData.get("provisionalCardSpending"));

  if (
    monthlySalaryNet === null ||
    mealVoucherAmount === null ||
    monthlySavingsTarget === null ||
    paydayStartDay === null ||
    paydayEndDay === null
  ) {
    return { success: false, message: "Valeurs invalides." };
  }

  if (monthlySavingsTarget > monthlySalaryNet + mealVoucherAmount) {
    return {
      success: false,
      message: "L'objectif d'épargne ne peut pas dépasser vos revenus mensuels.",
    };
  }

  if (paydayEndDay < paydayStartDay) {
    return {
      success: false,
      message: "Le jour de fin de paye doit être après le jour de début.",
    };
  }

  if (provisionalRaw !== "" && provisionalCardSpending === null) {
    return { success: false, message: "Prévisionnel carte invalide." };
  }

  const current = await getBudgetSettings();
  await updateBudgetSettings({
    ...current,
    monthlySalaryNet,
    mealVoucherAmount,
    monthlySavingsTarget,
    paydayStartDay,
    paydayEndDay,
    provisionalCardSpending,
  });

  revalidatePath("/");
  revalidatePath("/budgets");

  return { success: true, message: "Budget mensuel mis à jour." };
}

export async function updateProvisionalCardSpending(formData: FormData) {
  const amount = parseAmount(formData.get("provisionalCardSpending"));
  if (amount === null) return { success: false, message: "Montant invalide." };

  const current = await getBudgetSettings();
  await updateBudgetSettings({ ...current, provisionalCardSpending: amount });

  revalidatePath("/");
  revalidatePath("/budgets");

  return {
    success: true,
    message: `Prévisionnel carte mis à jour : ${amount.toLocaleString("fr-FR")} €.`,
  };
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
