import { labelMatchesKeyword } from "@/lib/import/label-utils";
import { categoryKeywords } from "@/lib/import/category-keywords";
import { isMoneyMovement, MONEY_MOVEMENT_CATEGORY } from "@/lib/import/transfer-detector";

export function guessCategory(
  label: string,
  amount: number,
  userRules: { keyword: string; categoryName: string }[] = [],
): string {
  for (const rule of userRules) {
    if (labelMatchesKeyword(label, rule.keyword)) {
      return rule.categoryName;
    }
  }

  if (isMoneyMovement(label)) {
    return MONEY_MOVEMENT_CATEGORY;
  }

  const normalized = label.toLowerCase();

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return category;
    }
  }

  return amount >= 0 ? "Autres revenus" : "Autres dépenses";
}

export { isFallbackCategory } from "@/lib/import/payment-lookup";
