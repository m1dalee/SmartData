import { isSavingsTransfer } from "@/lib/import/savings-transfer-detector";
import {
  detectSelfSavingsNames,
  isSelfSavingsIncoming,
  isSelfSavingsMovement,
  isSelfSavingsOutgoing,
} from "@/lib/import/self-savings-detector";
import { MONEY_MOVEMENT_CATEGORY, isMoneyMovement } from "@/lib/import/transfer-detector";

export type TransactionWithCategory = {
  amount: number;
  type: "expense" | "income";
  label: string;
  date: string;
  categoryName?: string | null;
};

export function getSelfSavingsNames(transactions: Pick<TransactionWithCategory, "label">[]): Set<string> {
  return detectSelfSavingsNames(transactions);
}

/** Virement interne / mouvement entre comptes — exclu du suivi mensuel. */
export function isTransferTransaction(
  tx: Pick<TransactionWithCategory, "label" | "categoryName">,
  selfSavingsNames: Set<string> = new Set(),
): boolean {
  if (
    isSelfSavingsMovement(tx.label, selfSavingsNames) ||
    isSelfSavingsOutgoing(tx.label, selfSavingsNames) ||
    isSelfSavingsIncoming(tx.label, selfSavingsNames)
  ) {
    return true;
  }

  if (tx.categoryName === MONEY_MOVEMENT_CATEGORY) return true;
  return isMoneyMovement(tx.label);
}

export function filterRealTransactions<T extends TransactionWithCategory>(
  transactions: T[],
  selfSavingsNames?: Set<string>,
): T[] {
  const names = selfSavingsNames ?? getSelfSavingsNames(transactions);
  return transactions.filter((tx) => !isTransferTransaction(tx, names));
}

export function sumRealIncome(
  transactions: TransactionWithCategory[],
  selfSavingsNames?: Set<string>,
): number {
  const names = selfSavingsNames ?? getSelfSavingsNames(transactions);
  return filterRealTransactions(transactions, names)
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
}

export function sumRealExpenses(
  transactions: TransactionWithCategory[],
  selfSavingsNames?: Set<string>,
): number {
  const names = selfSavingsNames ?? getSelfSavingsNames(transactions);
  return filterRealTransactions(transactions, names)
    .filter((tx) => tx.type === "expense")
    .filter((tx) => !isSavingsTransfer(tx.label, names))
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
}

export function countTransfers(
  transactions: TransactionWithCategory[],
  selfSavingsNames?: Set<string>,
): number {
  const names = selfSavingsNames ?? getSelfSavingsNames(transactions);
  return transactions.filter((tx) => isTransferTransaction(tx, names)).length;
}
