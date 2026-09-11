"use server";

import { revalidatePath } from "next/cache";
import { setMonthlySavingsTarget } from "@/lib/monthly-plan";

export async function updateMonthlySavingsTarget(formData: FormData) {
  const raw = formData.get("monthlySavingsTarget");
  const amount = Number.parseFloat(String(raw));

  if (Number.isNaN(amount) || amount < 0) {
    return { success: false, message: "Montant invalide." };
  }

  await setMonthlySavingsTarget(amount);

  revalidatePath("/");
  revalidatePath("/budgets");

  return {
    success: true,
    message: `Objectif d'épargne mensuel fixé à ${amount.toLocaleString("fr-FR")} €.`,
  };
}
