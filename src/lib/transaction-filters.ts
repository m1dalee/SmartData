import { MONEY_MOVEMENT_CATEGORY, isMoneyMovement } from "@/lib/import/transfer-detector";

export type TransactionWithCategory = {
  amount: number;
  type: "expense" | "income";
  label: string;
  date: string;
  categoryName?: string | null;
};

/** Virement interne / mouvement entre comptes — exclu du suivi mensuel. */
export function isTransferTransaction(tx: Pick<TransactionWithCategory, "label" | "categoryName">): boolean {
  if (tx.categoryName === MONEY_MOVEMENT_CATEGORY) return true;
  return isMoneyMovement(tx.label);
}

export function filterRealTransactions<T extends TransactionWithCategory>(transactions: T[]): T[] {
  return transactions.filter((tx) => !isTransferTransaction(tx));
}

export function sumRealIncome(transactions: TransactionWithCategory[]): number {
  return filterRealTransactions(transactions)
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
}

export function sumRealExpenses(transactions: TransactionWithCategory[]): number {
  return filterRealTransactions(transactions)
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
}

export function countTransfers(transactions: TransactionWithCategory[]): number {
  return transactions.filter((tx) => isTransferTransaction(tx)).length;
}
