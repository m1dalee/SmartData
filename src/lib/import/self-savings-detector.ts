/** Détecte les virements vers/depuis son propre Livret (Crédit Agricole : WEB/DE MONSIEUR …). */

export function normalizePersonName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractOutgoingSelfName(label: string): string | null {
  const normalized = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const webMatch = normalized.match(
    /virement\s+emis[\s\S]*?\bweb\s+(?:monsieur|madame|m\.|mme)\s+([a-z][a-z\s'-]{2,})/,
  );
  if (webMatch?.[1]) {
    return normalizePersonName(webMatch[1].split("\n")[0].trim());
  }

  return null;
}

function extractIncomingSelfName(label: string): string | null {
  const normalized = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const deMatch = normalized.match(
    /\bde\s+(?:monsieur|madame|m\.|mme)\s+([a-z][a-z\s'-]{2,})/,
  );
  if (deMatch?.[1]) {
    return normalizePersonName(deMatch[1].split("\n")[0].trim());
  }

  return null;
}

/** Noms qui apparaissent en virement émis WEB et en virement reçu DE → compte épargne perso. */
export function detectSelfSavingsNames(transactions: { label?: string | null }[]): Set<string> {
  const outgoing = new Set<string>();
  const incoming = new Set<string>();

  for (const tx of transactions) {
    const label = tx.label ?? "";
    const outName = extractOutgoingSelfName(label);
    const inName = extractIncomingSelfName(label);
    if (outName) outgoing.add(outName);
    if (inName) incoming.add(inName);
  }

  const paired = new Set([...outgoing].filter((name) => incoming.has(name)));
  if (paired.size > 0) return paired;
  // Compte courant seul dans le CSV : les virements WEB vers le Livret suffisent.
  return outgoing;
}

export function isSelfSavingsOutgoing(label: string, names: Set<string>): boolean {
  const name = extractOutgoingSelfName(label);
  return name !== null && names.has(name);
}

export function isSelfSavingsIncoming(label: string, names: Set<string>): boolean {
  const name = extractIncomingSelfName(label);
  return name !== null && names.has(name);
}

export function isSelfSavingsMovement(
  label: string,
  names: Set<string>,
): boolean {
  return isSelfSavingsOutgoing(label, names) || isSelfSavingsIncoming(label, names);
}

export function sumSelfSavingsMovements(
  transactions: { label?: string | null; amount: number; type?: string }[],
  names: Set<string>,
): { deposits: number; withdrawals: number; net: number } {
  let deposits = 0;
  let withdrawals = 0;

  for (const tx of transactions) {
    const label = tx.label ?? "";
    const amount = Math.abs(tx.amount);
    if (isSelfSavingsOutgoing(label, names)) {
      deposits += amount;
    } else if (isSelfSavingsIncoming(label, names)) {
      withdrawals += amount;
    }
  }

  return { deposits, withdrawals, net: deposits - withdrawals };
}
