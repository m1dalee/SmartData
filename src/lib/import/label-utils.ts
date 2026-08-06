const STOPWORDS = new Set([
  "virement",
  "prelevement",
  "paiement",
  "carte",
  "cb",
  "facture",
  "remise",
  "cheque",
  "retrait",
  "dab",
  "vir",
  "prlv",
  "sepa",
  "instant",
  "de",
  "du",
  "par",
]);

export function extractKeyword(label: string): string {
  const words = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));

  if (words.length === 0) {
    return label.trim().slice(0, 16);
  }

  return words.sort((a, b) => b.length - a.length)[0];
}

export function labelMatchesKeyword(label: string, keyword: string): boolean {
  const normalized = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const normalizedKeyword = keyword
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return normalized.includes(normalizedKeyword);
}
