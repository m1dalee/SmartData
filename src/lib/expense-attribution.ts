import {
  isDeferredCardSettlement,
  isLikelyCardPurchase,
  parseDeferredCardSettlement,
  type DeferredCardSettlement,
} from "@/lib/import/deferred-card-detector";
import { isSavingsTransfer } from "@/lib/import/savings-transfer-detector";
import { isSelfSavingsMovement, detectSelfSavingsNames } from "@/lib/import/self-savings-detector";
import { isTransferTransaction, type TransactionWithCategory } from "@/lib/transaction-filters";

export type EffectiveExpenses = {
  /** Total utilisé pour le budget (réel + provisionnel carte). */
  total: number;
  /** Prélèvements, assurances, etc. */
  other: number;
  /** Prélèvement carte différé déjà passé sur la période. */
  cardSettled: number;
  /** Achats carte visibles dans le CSV mais pas encore prélevés. */
  cardProvisional: number;
  /** Saisie manuelle depuis l'app bancaire (optionnel). */
  cardManualOverride: number | null;
  /** Estimation basée sur le prélèvement carte du mois précédent. */
  cardEstimated: number;
  /** Un prélèvement carte est attendu mais pas encore dans le CSV. */
  hasPendingCardSettlement: boolean;
  /** Au moins une part des dépenses carte est encore estimée / provisoire. */
  isProvisional: boolean;
  settlements: DeferredCardSettlement[];
};

function isExcludedFromExpenses(
  tx: TransactionWithCategory,
  selfSavingsNames: Set<string>,
): boolean {
  if (tx.type !== "expense") return true;
  if (isTransferTransaction(tx, selfSavingsNames)) return true;
  if (isSelfSavingsMovement(tx.label, selfSavingsNames)) return true;
  if (isSavingsTransfer(tx.label, selfSavingsNames)) return true;
  return false;
}

function isMerchantCoveredBySettlement(
  tx: TransactionWithCategory,
  settlements: DeferredCardSettlement[],
): boolean {
  if (!isLikelyCardPurchase(tx.label)) return false;

  return settlements.some(
    (s) => tx.date <= s.consumptionCutoff && s.debitDate >= tx.date,
  );
}

function settlementAppliesToPeriod(
  settlement: DeferredCardSettlement,
  periodStart: string,
  periodEnd: string,
): boolean {
  // Compte sur le mois de consommation (cutoff), pas la date de débit bancaire.
  return settlement.consumptionCutoff >= periodStart && settlement.consumptionCutoff <= periodEnd;
}

/**
 * Calcule les dépenses effectives d'une période en gérant le paiement différé :
 * - prélèvement carte = dépenses réelles du mois de consommation ;
 * - achats carte individuels = provisionnel tant que le prélèvement n'est pas passé ;
 * - pas de double comptage entre les deux.
 */
function findPreviousCardSettlement(
  settlements: DeferredCardSettlement[],
  periodStart: string,
): DeferredCardSettlement | null {
  const before = settlements
    .filter((s) => s.consumptionCutoff < periodStart)
    .sort((a, b) => b.consumptionCutoff.localeCompare(a.consumptionCutoff));
  return before[0] ?? null;
}

export function computeEffectiveExpenses(
  transactions: TransactionWithCategory[],
  periodStart: string,
  periodEnd: string,
  options?: { manualCardSpending?: number | null },
): EffectiveExpenses {
  const selfSavingsNames = detectSelfSavingsNames(transactions);

  const allSettlements = transactions
    .filter((tx) => tx.type === "expense" && isDeferredCardSettlement(tx.label))
    .map((tx) => parseDeferredCardSettlement(tx.label, tx.amount, tx.date))
    .filter((s): s is DeferredCardSettlement => s !== null);

  const periodSettlements = allSettlements.filter((s) =>
    settlementAppliesToPeriod(s, periodStart, periodEnd),
  );

  let other = 0;
  let cardProvisional = 0;

  for (const tx of transactions) {
    if (tx.date < periodStart || tx.date > periodEnd) continue;
    if (isExcludedFromExpenses(tx, selfSavingsNames)) continue;
    if (isDeferredCardSettlement(tx.label)) continue;

    const amount = Math.abs(tx.amount);

    if (isLikelyCardPurchase(tx.label)) {
      if (isMerchantCoveredBySettlement(tx, allSettlements)) continue;
      cardProvisional += amount;
      continue;
    }

    other += amount;
  }

  const cardSettled = periodSettlements.reduce((sum, s) => sum + s.amount, 0);
  const manualOverride =
    options?.manualCardSpending != null && options.manualCardSpending >= 0
      ? options.manualCardSpending
      : null;

  const previousSettlement = findPreviousCardSettlement(allSettlements, periodStart);
  const cardEstimated = previousSettlement?.amount ?? 0;

  let cardTotal = 0;
  let isProvisional = false;

  if (cardSettled > 0) {
    cardTotal = Math.max(cardSettled, cardProvisional);
  } else if (manualOverride !== null) {
    cardTotal = Math.max(manualOverride, cardProvisional);
    isProvisional = cardProvisional < manualOverride;
  } else if (cardProvisional > 0) {
    cardTotal = cardProvisional;
    isProvisional = true;
  } else if (cardEstimated > 0 && periodEnd >= new Date().toISOString().slice(0, 10)) {
    cardTotal = cardEstimated;
    isProvisional = true;
  }

  const hasPendingCardSettlement =
    cardSettled === 0 &&
    cardTotal > 0 &&
    periodEnd >= new Date().toISOString().slice(0, 10);

  return {
    total: other + cardTotal,
    other,
    cardSettled,
    cardProvisional,
    cardManualOverride: manualOverride,
    cardEstimated,
    hasPendingCardSettlement,
    isProvisional,
    settlements: periodSettlements,
  };
}
