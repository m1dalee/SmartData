import { categoryKeywords } from "@/lib/import/category-keywords";
import { extractKeyword } from "@/lib/import/label-utils";

const BANK_NOISE =
  /^(prlv|prelevement|paiement|carte|cb|vir|virement|sepa|inst|remise|retrait|dab|commission|facture|du\s|de\s|le\s|la\s|\d{2}[/.]\d{2})/gi;

export function buildSearchQuery(label: string): string {
  const cleaned = label
    .replace(/carte\s*\*?\d*/gi, "")
    .replace(/cb\s*\*?\d*/gi, "")
    .replace(/\*{1,3}\d*/g, "")
    .replace(/prlv|prelevement|paiement par carte/gi, "")
    .replace(/\d{2}[/.]\d{2}[/.]\d{2,4}/g, "")
    .replace(/[\d*]{5,}/g, "")
    .replace(BANK_NOISE, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned
    .split(/[\s\-*./]+/)
    .filter((w) => w.length > 2 && !/^(vir|sepa|inst|fr|paris|lyon|marseille|france)$/i.test(w))
    .slice(0, 4);

  if (words.length === 0) return cleaned || label.slice(0, 30);
  return words.join(" ");
}

export function matchCategoryFromText(text: string): string | null {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  let bestCategory: string | null = null;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (category === "Autres revenus" || category === "Autres dépenses") continue;

    for (const keyword of keywords) {
      const kw = keyword
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
      if (kw.length < 2) continue;
      if (normalized.includes(kw) && kw.length > bestScore) {
        bestScore = kw.length;
        bestCategory = category;
      }
    }
  }

  return bestCategory;
}

function matchFromLabel(label: string): LookupResult | null {
  const categoryName = matchCategoryFromText(label);
  if (!categoryName) return null;

  return {
    categoryName,
    keyword: extractKeyword(label).toLowerCase(),
    source: "Analyse du libellé bancaire",
    provider: "label",
    confidence: "high",
  };
}

async function searchWikipedia(query: string): Promise<string> {
  try {
    const response = await fetch(
      `https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=3&format=json&origin=*`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!response.ok) return "";

    const data = (await response.json()) as {
      query?: { search?: { title: string; snippet: string }[] };
    };

    return (data.query?.search ?? [])
      .map((r) => `${r.title} ${r.snippet.replace(/<[^>]+>/g, "")}`)
      .join(" ");
  } catch {
    return "";
  }
}

async function searchBingRss(query: string): Promise<string> {
  try {
    const response = await fetch(
      `https://www.bing.com/search?q=${encodeURIComponent(query + " enseigne commerce")}&format=rss`,
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; SmartData/1.0)" },
        signal: AbortSignal.timeout(6000),
      },
    );
    if (!response.ok) return "";

    const xml = await response.text();
    const titles = [...xml.matchAll(/<title>([^<]+)<\/title>/g)]
      .map((m) => m[1])
      .filter((t) => !t.includes("Bing") && t.length > 3);
    const descriptions = [...xml.matchAll(/<description>([^<]+)<\/description>/g)].map((m) =>
      m[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"'),
    );

    return [...titles, ...descriptions].join(" ");
  } catch {
    return "";
  }
}

async function searchDuckDuckGo(query: string): Promise<string> {
  try {
    const response = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(6000),
      },
    );
    if (!response.ok || response.status === 202) return "";

    const html = await response.text();
    if (!html.includes("result__snippet")) return "";

    const snippets: string[] = [];
    const snippetRegex = /class="result__snippet"[^>]*>([\s\S]*?)<\//g;
    let match;
    while ((match = snippetRegex.exec(html)) !== null && snippets.length < 5) {
      snippets.push(match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    }
    return snippets.join(" ");
  } catch {
    return "";
  }
}

export type SearchProvider = "label" | "wikipedia" | "bing" | "duckduckgo";

export type LookupResult = {
  categoryName: string;
  keyword: string;
  source: string;
  provider: SearchProvider;
  confidence: "high" | "medium";
};

async function lookupViaWeb(
  label: string,
  query: string,
): Promise<LookupResult | null> {
  const providers: { name: SearchProvider; fetch: () => Promise<string> }[] = [
    { name: "wikipedia", fetch: () => searchWikipedia(query) },
    { name: "bing", fetch: () => searchBingRss(query) },
    { name: "duckduckgo", fetch: () => searchDuckDuckGo(query) },
  ];

  for (const { name, fetch } of providers) {
    const content = await fetch();
    if (!content || content.length < 10) continue;

    const combined = `${label} ${content}`;
    const categoryName = matchCategoryFromText(combined);
    if (!categoryName) continue;

    const keyword =
      buildSearchQuery(label).split(" ").find((w) => w.length > 3)?.toLowerCase() ??
      extractKeyword(label).toLowerCase();

    return {
      categoryName,
      keyword,
      source: content.slice(0, 180),
      provider: name,
      confidence: name === "wikipedia" ? "high" : "medium",
    };
  }

  return null;
}

export async function lookupPaymentCategory(label: string): Promise<LookupResult | null> {
  const fromLabel = matchFromLabel(label);
  if (fromLabel) return fromLabel;

  const query = buildSearchQuery(label);
  if (query.length < 2) return null;

  return lookupViaWeb(label, query);
}

export function isFallbackCategory(categoryName: string | null | undefined): boolean {
  return !categoryName || categoryName === "Autres dépenses" || categoryName === "Autres revenus";
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const PROVIDER_LABELS: Record<SearchProvider, string> = {
  label: "Libellé bancaire",
  wikipedia: "Wikipedia",
  bing: "Bing",
  duckduckgo: "DuckDuckGo",
};
