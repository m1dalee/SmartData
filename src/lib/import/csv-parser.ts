import Papa from "papaparse";

export type ParsedTransaction = {
  date: string;
  label: string;
  amount: number;
  type: "expense" | "income";
  bankReference?: string;
};

export type ColumnMapping = {
  date?: string;
  label?: string;
  debit?: string;
  credit?: string;
  amount?: string;
  operationRef?: string;
};

const DATE_KEYWORDS = [
  "date",
  "datum",
  "operation",
  "comptable",
  "valeur",
  "booking",
  "transaction",
];

const LABEL_KEYWORDS = [
  "libelle",
  "label",
  "description",
  "intitule",
  "motif",
  "detail",
  "wording",
  "merchant",
  "contrepartie",
  "nom",
  "designation",
];

const OPERATION_REF_KEYWORDS = [
  "ref",
  "reference",
  "identifiant",
  "numero",
  "ecriture",
  "piece",
  "id",
  "operation id",
];

const DEBIT_KEYWORDS = ["debit", "depense", "sortie", "retrait", "paiement"];
const CREDIT_KEYWORDS = ["credit", "recette", "entree", "versement", "encaissement"];
const AMOUNT_KEYWORDS = ["montant", "amount", "somme", "total", "eur", "value"];

function stripBom(text: string): string {
  return text.replace(/^\uFEFF/, "");
}

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function headerMatches(header: string, keywords: string[]): boolean {
  const norm = normalizeHeader(header);
  if (!norm) return false;
  return keywords.some((keyword) => norm === keyword || norm.includes(keyword));
}

function detectDelimiter(content: string): string {
  const sample = content.split(/\r?\n/).slice(0, 8).join("\n");
  const counts: Record<string, number> = {
    ";": (sample.match(/;/g) ?? []).length,
    ",": (sample.match(/,/g) ?? []).length,
    "\t": (sample.match(/\t/g) ?? []).length,
  };
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : ";";
}

function findHeaderLineIndex(lines: string[], delimiter: string): number {
  for (let i = 0; i < Math.min(lines.length, 25); i++) {
    const line = lines[i]?.trim();
    if (!line) continue;

    const cells = line.split(delimiter).map((c) => c.replace(/^"|"$/g, "").trim());
    const hasDate = cells.some((c) => headerMatches(c, DATE_KEYWORDS));
    const hasLabel = cells.some((c) => headerMatches(c, LABEL_KEYWORDS));
    const hasAmount = cells.some(
      (c) =>
        headerMatches(c, AMOUNT_KEYWORDS) ||
        headerMatches(c, DEBIT_KEYWORDS) ||
        headerMatches(c, CREDIT_KEYWORDS),
    );

    if (hasDate && (hasLabel || hasAmount)) return i;
  }
  return 0;
}

function findColumn(headers: string[], keywords: string[]): string | undefined {
  for (const header of headers) {
    if (headerMatches(header, keywords)) return header;
  }
  return undefined;
}

function detectMapping(headers: string[]): ColumnMapping {
  const cleaned = headers.map((h) => h.trim()).filter(Boolean);

  const operationRef = findColumn(cleaned, OPERATION_REF_KEYWORDS);
  const labelCandidates = cleaned.filter((h) => h !== operationRef);

  return {
    date: findColumn(cleaned, DATE_KEYWORDS),
    label: findColumn(labelCandidates, LABEL_KEYWORDS),
    debit: findColumn(cleaned, DEBIT_KEYWORDS),
    credit: findColumn(cleaned, CREDIT_KEYWORDS),
    amount: findColumn(cleaned, AMOUNT_KEYWORDS),
    operationRef,
  };
}

function inferMappingFromData(rows: Record<string, string>[], headers: string[]): ColumnMapping {
  if (rows.length === 0 || headers.length === 0) return {};

  const dateScores = new Map<string, number>();
  const labelScores = new Map<string, number>();
  const numericScores = new Map<string, number>();

  for (const header of headers) {
    dateScores.set(header, 0);
    labelScores.set(header, 0);
    numericScores.set(header, 0);
  }

  const sample = rows.slice(0, 30);
  for (const row of sample) {
    for (const header of headers) {
      const value = row[header]?.trim() ?? "";
      if (!value) continue;
      if (parseDate(value)) dateScores.set(header, (dateScores.get(header) ?? 0) + 1);
      if (/^-?\d[\d\s.,]*€?$/.test(value.replace(/\u00a0/g, " "))) {
        numericScores.set(header, (numericScores.get(header) ?? 0) + 1);
      }
      if (value.length >= 4 && /[a-zA-ZÀ-ÿ]/.test(value)) {
        labelScores.set(header, (labelScores.get(header) ?? 0) + 1);
      }
    }
  }

  const bestDate = [...dateScores.entries()].sort((a, b) => b[1] - a[1])[0];
  const bestLabel = [...labelScores.entries()].sort((a, b) => b[1] - a[1])[0];
  const numericCols = [...numericScores.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  const mapping: ColumnMapping = {};
  if (bestDate && bestDate[1] >= 2) mapping.date = bestDate[0];
  if (bestLabel && bestLabel[1] >= 2) mapping.label = bestLabel[0];

  if (numericCols.length >= 2) {
    mapping.debit = numericCols[0][0];
    mapping.credit = numericCols[1][0];
  } else if (numericCols.length === 1) {
    mapping.amount = numericCols[0][0];
  }

  return mapping;
}

function parseFrenchNumber(value: string): number {
  const cleaned = value
    .replace(/\s/g, "")
    .replace(/\u00a0/g, "")
    .replace(/€/g, "")
    .replace(/EUR/gi, "")
    .replace(",", ".");
  return Number.parseFloat(cleaned);
}

function parseDate(value: string): string | null {
  const trimmed = value.trim();
  const frMatch = trimmed.match(/^(\d{2})[/.-](\d{2})[/.-](\d{4})$/);
  if (frMatch) return `${frMatch[3]}-${frMatch[2]}-${frMatch[1]}`;

  const shortFr = trimmed.match(/^(\d{2})[/.-](\d{2})[/.-](\d{2})$/);
  if (shortFr) return `20${shortFr[3]}-${shortFr[2]}-${shortFr[1]}`;

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  return null;
}

function mappingIsComplete(mapping: ColumnMapping): boolean {
  const hasAmount = Boolean(mapping.amount || mapping.debit || mapping.credit);
  return Boolean(mapping.date && mapping.label && hasAmount);
}

function buildBankReference(
  row: Record<string, string>,
  mapping: ColumnMapping,
  date: string,
  label: string,
  amount: number,
): string {
  const opRef = mapping.operationRef ? row[mapping.operationRef]?.trim() : "";
  if (opRef) return `op:${opRef}`;

  return `${date}|${label}|${amount.toFixed(2)}`;
}

function rowToTransaction(
  row: Record<string, string>,
  mapping: ColumnMapping,
): ParsedTransaction | null {
  const dateRaw = mapping.date ? row[mapping.date] : "";
  const label = mapping.label ? row[mapping.label]?.trim() : "";
  const date = parseDate(dateRaw ?? "");

  if (!date || !label) return null;

  let amount = 0;

  if (mapping.debit || mapping.credit) {
    const debitRaw = mapping.debit ? row[mapping.debit]?.trim() : "";
    const creditRaw = mapping.credit ? row[mapping.credit]?.trim() : "";
    const debit = debitRaw ? Math.abs(parseFrenchNumber(debitRaw)) : 0;
    const credit = creditRaw ? Math.abs(parseFrenchNumber(creditRaw)) : 0;

    if (debit > 0) amount = -debit;
    else if (credit > 0) amount = credit;
    else return null;
  } else if (mapping.amount) {
    const raw = row[mapping.amount]?.trim();
    if (!raw) return null;
    amount = parseFrenchNumber(raw);
  } else {
    return null;
  }

  if (Number.isNaN(amount) || amount === 0) return null;

  return {
    date,
    label,
    amount,
    type: amount >= 0 ? "income" : "expense",
    bankReference: buildBankReference(row, mapping, date, label, amount),
  };
}

export function decodeBankFile(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3).toString("utf-8");
  }

  const utf8 = buffer.toString("utf-8");
  if (!utf8.includes("\ufffd")) return utf8;

  return buffer.toString("latin1");
}

export function parseBankCsv(rawContent: string): {
  transactions: ParsedTransaction[];
  mapping: ColumnMapping;
  headers: string[];
  errors: string[];
} {
  const content = stripBom(rawContent.replace(/\r\n/g, "\n"));
  const delimiter = detectDelimiter(content);
  const lines = content.split("\n");
  const headerIndex = findHeaderLineIndex(lines, delimiter);
  const csvBody = lines.slice(headerIndex).join("\n");

  const parsed = Papa.parse<Record<string, string>>(csvBody, {
    header: true,
    skipEmptyLines: true,
    delimiter,
    transformHeader: (header) => stripBom(header.trim()),
  });

  const headers = (parsed.meta.fields ?? []).map((h) => h.trim()).filter(Boolean);

  if (headers.length === 0) {
    return {
      transactions: [],
      mapping: {},
      headers: [],
      errors: ["Fichier CSV vide ou illisible."],
    };
  }

  let mapping = detectMapping(headers);
  if (!mappingIsComplete(mapping)) {
    const inferred = inferMappingFromData(parsed.data, headers);
    mapping = {
      date: mapping.date ?? inferred.date,
      label: mapping.label ?? inferred.label,
      debit: mapping.debit ?? inferred.debit,
      credit: mapping.credit ?? inferred.credit,
      amount: mapping.amount ?? inferred.amount,
    };
  }

  const errors: string[] = [];
  if (!mapping.date) errors.push("Colonne date introuvable.");
  if (!mapping.label) errors.push("Colonne libellé introuvable.");
  if (!mapping.amount && !mapping.debit && !mapping.credit) {
    errors.push("Colonne montant/débit/crédit introuvable.");
  }

  if (errors.length > 0) {
    errors.push(`Colonnes détectées : ${headers.join(" | ")}`);
    return { transactions: [], mapping, headers, errors };
  }

  const transactions = parsed.data
    .map((row) => rowToTransaction(row, mapping))
    .filter((tx): tx is ParsedTransaction => tx !== null);

  if (transactions.length === 0) {
    return {
      transactions: [],
      mapping,
      headers,
      errors: [
        "Aucune transaction valide trouvée. Vérifiez que le fichier contient des dates (JJ/MM/AAAA) et des montants.",
        `Colonnes utilisées : date="${mapping.date}", libellé="${mapping.label}"`,
      ],
    };
  }

  return { transactions, mapping, headers, errors: [] };
}
