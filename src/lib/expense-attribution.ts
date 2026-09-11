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
  /** Montant du dernier prélèvement carte (indicatif seulement). */
  lastCardSettlement: number;
  /** Un prélèvement carte est attendu mais pas encore dans le CSV. */
  hasPendingCardSettlement: boolean;
  /** Au moins une part des dépenses carte est encore provisoire. */
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
  return settlement.consumptionCutoff >= periodStart && settlement.consumptionCutoff <= periodEnd;
}

function isOpenPeriod(periodStart: string, periodEnd: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return today >= periodStart && today <= periodEnd;
}

function findLastCardSettlement(
  settlements: DeferredCardSettlement[],
): DeferredCardSettlement | null {
  return [...settlements].sort((a, b) => b.consumptionCutoff.localeCompare(a.consumptionCutoff))[0] ?? null;
}

function getAllSettlements(transactions: TransactionWithCategory[]): DeferredCardSettlement[] {
  return transactions
    .filter((tx) => tx.type === "expense" && isDeferredCardSettlement(tx.label))
    .map((tx) => parseDeferredCardSettlement(tx.label, tx.amount, tx.date))
    .filter((s): s is DeferredCardSettlement => s !== null);
}

/** Prélèvements / hors carte sur une période (cycle de paye). */
export function computeOtherExpenses(
  transactions: TransactionWithCategory[],
  periodStart: string,
  periodEnd: string,
): number {
  const selfSavingsNames = detectSelfSavingsNames(transactions);
  const allSettlements = getAllSettlements(transactions);
  let other = 0;

  for (const tx of transactions) {
    if (tx.date < periodStart || tx.date > periodEnd) continue;
    if (isExcludedFromExpenses(tx, selfSavingsNames)) continue;
    if (isDeferredCardSettlement(tx.label)) continue;
    if (isLikelyCardPurchase(tx.label)) continue;

    other += Math.abs(tx.amount);
  }

  // Prélèvements carte comptés via computeCardSpending, pas ici.
  void allSettlements;

  return other;
}

/**
 * Dépenses carte pour un mois calendaire (aligné sur le prévisionnel CA).
 * Le prélèvement du ~30 est attribué au mois de consommation, pas au mois de débit.
 */
export function computeCardSpending(
  transactions: TransactionWithCategory[],
  periodStart: string,
  periodEnd: string,
  options?: { manualCardSpending?: number | null; applyManual?: boolean },
): Pick<
  EffectiveExpenses,
  | "cardSettled"
  | "cardProvisional"
  | "cardManualOverride"
  | "lastCardSettlement"
  | "hasPendingCardSettlement"
  | "isProvisional"
  | "settlements"
> & { cardTotal: number } {
  const allSettlements = getAllSettlements(transactions);
  const periodSettlements = allSettlements.filter((s) =>
    settlementAppliesToPeriod(s, periodStart, periodEnd),
  );
  const lastSettlement = findLastCardSettlement(allSettlements);

  let cardProvisional = 0;
  for (const tx of transactions) {
    if (tx.date < periodStart || tx.date > periodEnd) continue;
    if (!isLikelyCardPurchase(tx.label)) continue;
    if (isMerchantCoveredBySettlement(tx, allSettlements)) continue;
    cardProvisional += Math.abs(tx.amount);
  }

  const cardSettled = periodSettlements.reduce((sum, s) => sum + s.amount, 0);
  const manualOverride =
    options?.applyManual !== false &&
    options?.manualCardSpending != null &&
    options.manualCardSpending >= 0
      ? options.manualCardSpending
      : null;
  const openPeriod = isOpenPeriod(periodStart, periodEnd);

  let cardTotal = 0;
  let isProvisional = false;

  if (cardSettled > 0) {
    // Prélèvement du ~30 passé : montant réel, point final.
    cardTotal = cardSettled;
  } else if (openPeriod && manualOverride !== null) {
    // Prévisionnel saisi = source de vérité (ne pas ajouter d'estimation).
    cardTotal = manualOverride;
    isProvisional = true;
  } else if (cardProvisional > 0) {
    cardTotal = cardProvisional;
    isProvisional = openPeriod;
  }

  const hasPendingCardSettlement = openPeriod && cardSettled === 0 && cardTotal > 0;

  return {
    cardTotal,
    cardSettled,
    cardProvisional,
    cardManualOverride: openPeriod ? manualOverride : null,
    lastCardSettlement: lastSettlement?.amount ?? 0,
    hasPendingCardSettlement,
    isProvisional,
    settlements: periodSettlements,
  };
}

/** Budget complet = prélèvements du cycle + carte du mois calendaire. */
export function computeEffectiveExpenses(
  transactions: TransactionWithCategory[],
  periodStart: string,
  periodEnd: string,
  options?: { manualCardSpending?: number | null; applyManual?: boolean },
): EffectiveExpenses {
  const other = computeOtherExpenses(transactions, periodStart, periodEnd);
  const card = computeCardSpending(transactions, periodStart, periodEnd, options);

  return {
    total: other + card.cardTotal,
    other,
    cardSettled: card.cardSettled,
    cardProvisional: card.cardProvisional,
    cardManualOverride: card.cardManualOverride,
    lastCardSettlement: card.lastCardSettlement,
    hasPendingCardSettlement: card.hasPendingCardSettlement,
    isProvisional: card.isProvisional,
    settlements: card.settlements,
  };
}

/** Cycle de paye + mois calendaire courant pour la partie carte. */
export function computeBudgetExpenses(
  transactions: TransactionWithCategory[],
  cycleStart: string,
  cycleEnd: string,
  calendarMonthStart: string,
  calendarMonthEnd: string,
  options?: { manualCardSpending?: number | null },
): EffectiveExpenses {
  const other = computeOtherExpenses(transactions, cycleStart, cycleEnd);
  const card = computeCardSpending(transactions, calendarMonthStart, calendarMonthEnd, {
    manualCardSpending: options?.manualCardSpending,
    applyManual: true,
  });

  return {
    total: other + card.cardTotal,
    other,
    cardSettled: card.cardSettled,
    cardProvisional: card.cardProvisional,
    cardManualOverride: card.cardManualOverride,
    lastCardSettlement: card.lastCardSettlement,
    hasPendingCardSettlement: card.hasPendingCardSettlement,
    isProvisional: card.isProvisional,
    settlements: card.settlements,
  };
}
