/** Paiement différé Crédit Agricole : un prélèvement mensuel regroupe les dépenses carte. */

export type DeferredCardSettlement = {
  amount: number;
  debitDate: string;
  /** Dernière date de consommation incluse (libellé « AU JJ/MM/AA »). */
  consumptionCutoff: string;
  label: string;
};

function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isDeferredCardSettlement(label: string): boolean {
  const normalized = normalizeLabel(label);
  return (
    /prelevement\s+carte/.test(normalized) ||
    /depenses\s+carte/.test(normalized)
  );
}

/** Ex. « DEPENSES CARTE X3220 AU 18/08/26 » → 2026-08-18 */
export function parseDeferredCardCutoff(label: string): string | null {
  const normalized = normalizeLabel(label);
  const match = normalized.match(/au\s+(\d{2})[/.-](\d{2})[/.-](\d{2,4})/);
  if (!match) return null;

  const day = match[1];
  const month = match[2];
  let year = match[3];
  if (year.length === 2) year = `20${year}`;

  return `${year}-${month}-${day}`;
}

export function parseDeferredCardSettlement(
  label: string,
  amount: number,
  debitDate: string,
): DeferredCardSettlement | null {
  if (!isDeferredCardSettlement(label)) return null;

  return {
    amount: Math.abs(amount),
    debitDate,
    consumptionCutoff: parseDeferredCardCutoff(label) ?? debitDate,
    label,
  };
}

const NON_CARD_PREFIXES = [
  "prelevement",
  "prélèvement",
  "virement",
  "depenses carte",
  "frais carte",
  "floa",
  "remise",
  "retrait",
  "commission",
];

/** Achat carte individuel (visible avant le prélèvement différé). */
export function isLikelyCardPurchase(label: string): boolean {
  const normalized = normalizeLabel(label);
  if (NON_CARD_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return false;
  }
  if (isDeferredCardSettlement(label)) return false;
  // Les achats CB ont souvent un libellé commerçant (pas un prélèvement SEPA structuré).
  if (normalized.includes(" - ") && normalized.includes("fr")) return false;
  return true;
}
