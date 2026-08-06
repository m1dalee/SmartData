/** Détecte les virements entre particuliers / mouvements internes */

const EXCLUDED = [
  "salaire",
  "paie",
  "employeur",
  "urssaf",
  "impot",
  "impôt",
  "dgi",
  "tresor",
  "trésor",
  "caf ",
  "cpam",
  "mutuelle",
  "remboursement",
];

export function isMoneyMovement(label: string): boolean {
  const normalized = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (EXCLUDED.some((word) => normalized.includes(word))) return false;

  // "virement + hugo chave", "virement hugo", "vir inst hugo"
  if (/virement\s*[+\-]/.test(normalized)) return true;
  if (/virement\s+(de|vers|a|recu|recu|emis|émis|instantane|instantane)\b/.test(normalized)) return true;
  if (/^virement\b/.test(normalized) && normalized.replace(/virement|sepa|inst|vir|instantane|de|vers|recu|emis/g, "").trim().length >= 3) {
    return true;
  }
  if (/vir\s*inst/.test(normalized) && !/salaire|employeur/.test(normalized)) return true;

  // Prénom/nom après virement
  if (/virement.*[a-z]{2,}/.test(normalized) && !/amazon|carrefour|edf|engie/.test(normalized)) {
    const afterVirement = normalized.split("virement").slice(1).join(" ").trim();
    if (/^[+\-]?\s*[a-z\s\-']{3,}$/.test(afterVirement) && !/\d{5,}/.test(afterVirement)) {
      return true;
    }
  }

  return false;
}

export const MONEY_MOVEMENT_CATEGORY = "Mouvement d'argent";
