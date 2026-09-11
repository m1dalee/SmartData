import {
  detectSelfSavingsNames,
  isSelfSavingsOutgoing,
} from "@/lib/import/self-savings-detector";

/** Virement vers un compte épargne (Livret A, LDD, etc.) — épargne, pas une dépense. */

const SAVINGS_KEYWORDS = [
  "livret",
  "ldd",
  "ldds",
  "pel",
  "cel",
  "cat",
  "compte epargne",
  "compte épargne",
  "epargne",
  "épargne",
  "versement epargne",
  "versement épargne",
  "virement epargne",
  "virement épargne",
  "placement",
  "plan epargne",
  "plan épargne",
];

function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isSavingsTransfer(label: string, selfSavingsNames?: Set<string>): boolean {
  const normalized = normalizeLabel(label);

  if (SAVINGS_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return true;
  }

  if (selfSavingsNames && isSelfSavingsOutgoing(label, selfSavingsNames)) {
    return true;
  }

  return false;
}

export function buildSelfSavingsNamesFromTransactions(
  transactions: { label?: string | null }[],
): Set<string> {
  return detectSelfSavingsNames(transactions);
}
