"use server";

import { revalidatePath } from "next/cache";
import { updateMainGoalTotalSavings } from "@/lib/savings-goal";

export async function setMainGoalTotalSavings(formData: FormData) {
  const amount = Number.parseFloat(String(formData.get("totalSavings")));
  if (Number.isNaN(amount) || amount < 0) {
    return { success: false, message: "Montant invalide." };
  }

  const snapshot = await updateMainGoalTotalSavings(amount);

  revalidatePath("/");
  revalidatePath("/budgets");

  return {
    success: true,
    message: "Épargne totale mise à jour.",
    snapshot,
  };
}
