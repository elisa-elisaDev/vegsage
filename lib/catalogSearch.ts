/**
 * VegSage Catalog Search — Layer 2 of the new search architecture.
 *
 * Searches the vegCatalog.json against a pre-built token index.
 * No network calls, no USDA — pure local, instant results.
 *
 * Match scoring (per entry):
 *   100  exact token match in query locale
 *    80  exact token match in any locale
 *    60  prefix match in query locale (query ⊆ token or token ⊆ query)
 *    50  prefix match in any locale
 *    30  fuzzy match in query locale (Levenshtein ≤ threshold)
 *    20  fuzzy match in any locale
 *
 * Results are sorted by score DESC, then by processing rank (raw > cooked).
 */

import rawCatalog from "../data/vegCatalog.json";
import { stripAccents, levenshtein } from "./normalizeFoodQuery";
import type { Locale } from "./i18n";
import type { FoodProduct } from "./usdaClient";
import type { NutrientsPer100g } from "./nutrition";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CatalogEntry {
  canonical: string;
  category: string;
  labels: { en: string; fr: string; de: string };
  tokens: { en: string[]; fr: string[]; de: string[] };
  nutrients: {
    // Macros
    calories: number | null;
    protein:  number | null;
    fat:      number | null;
    carbs:    number | null;
    fiber:    number | null;
    sugar:    number | null;
    sodium:   number | null;
    // Micros
    iron:     number | null;
    calcium:  number | null;
    zinc:     number | null;
    b12:      number | null;
    omega3:   number | null;
    vitaminC: number | null;
    vitaminD: number | null;
  };
  note: string;
  usda_fdc_id: string | null;
}

// ─── Pre-built index ──────────────────────────────────────────────────────────

interface IndexEntry {
  entry: CatalogEntry;
  normTokens: { en: string[]; fr: string[]; de: string[] };
}

const CATALOG = rawCatalog as CatalogEntry[];

const INDEX: IndexEntry[] = CATALOG.map((entry) => ({
  entry,
  normTokens: {
    en: entry.tokens.en.map((t) => stripAccents(t.toLowerCase())),
    fr: entry.tokens.fr.map((t) => stripAccents(t.toLowerCase())),
    de: entry.tokens.de.map((t) => stripAccents(t.toLowerCase())),
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fuzzyThreshold(len: number): number {
  if (len <= 4) return 1;
  if (len <= 7) return 2;
  return 3;
}

function scoreAgainstTokenList(q: string, tokens: string[]): number {
  for (const t of tokens) {
    if (t === q) return 100;
  }
  for (const t of tokens) {
    if (t.includes(q) || q.includes(t)) return 60;
  }
  const threshold = fuzzyThreshold(q.length);
  for (const t of tokens) {
    if (levenshtein(q, t) <= threshold) return 30;
  }
  return 0;
}

/**
 * Score a (possibly multi-word) query against a token list.
 *
 * Multi-word queries get a 100-point bonus when the full phrase matches
 * to ensure "noix de cajou" → cashews beats "noix" → walnuts.
 * Individual word matches are capped at 50% when the full phrase also
 * partially matched (to prevent false wins from sub-words).
 */
function computeScore(q: string, words: string[], tokens: string[]): number {
  const phraseScore = scoreAgainstTokenList(q, tokens);

  // Single-word queries: straight score
  if (words.length <= 1) return phraseScore;

  // Multi-word: amplify phrase match to beat single-word matches from other entries
  if (phraseScore >= 100) return phraseScore + 100; // exact phrase → 200
  if (phraseScore > 0)   return phraseScore + 50;  // partial phrase → 110..160

  // Full phrase didn't match — fall back to best individual word, but at half weight
  let wordBest = 0;
  for (const w of words) {
    const s = scoreAgainstTokenList(w, tokens);
    if (s > wordBest) wordBest = s;
  }
  return Math.round(wordBest * 0.5);
}

/** Map catalog nutrients to the FoodProduct per100g shape. */
function toNutrientsPer100g(
  n: CatalogEntry["nutrients"]
): NutrientsPer100g {
  return {
    calories: n.calories,
    protein:  n.protein,
    fat:      n.fat,
    carbs:    n.carbs,
    fiber:    n.fiber,
    sugar:    n.sugar,
    sodium:   n.sodium,
    iron:     n.iron,
    calcium:  n.calcium,
    zinc:     n.zinc,
    b12:      n.b12,
    omega3:   n.omega3,
    vitaminC: n.vitaminC,
    vitaminD: n.vitaminD,
  };
}

/** Convert a CatalogEntry to the FoodProduct interface the UI expects. */
function toFoodProduct(entry: CatalogEntry, locale: Locale): FoodProduct {
  const label = entry.labels[locale] ?? entry.labels.en;
  return {
    off_id: `cat:${entry.canonical}`,
    name: label,
    brand: null,
    per100g: toNutrientsPer100g(entry.nutrients),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Search the local catalog for the given query.
 *
 * @param query   Raw user input — any language, any casing, with or without accents.
 * @param locale  Display locale for result labels.
 * @param limit   Max results to return.
 * @returns       Array of FoodProduct sorted by match quality.
 *
 * @example
 * searchCatalog("lentilles", "fr", 5)  // → [{ name: "Lentilles", … }]
 * searchCatalog("linsen", "de", 5)     // → [{ name: "Linsen", … }]
 * searchCatalog("salade verte", "fr")  // → [{ name: "Salade", … }]
 */
export function searchCatalog(
  query: string,
  locale: Locale,
  limit = 12
): FoodProduct[] {
  if (!query.trim() || query.trim().length < 2) return [];

  const q = stripAccents(query.toLowerCase().trim());
  // Individual words (length ≥ 2) for partial matching
  const words = q.split(/\s+/).filter((w) => w.length >= 2);

  const scored: Array<{ product: FoodProduct; score: number }> = [];

  for (const { entry, normTokens } of INDEX) {
    // Score against query locale using phrase-aware scoring
    const sameLocaleScore = computeScore(q, words, normTokens[locale]);

    // Score against other locales at 80% weight
    const otherLocales = (["en", "fr", "de"] as Locale[]).filter(
      (l) => l !== locale
    );
    let otherMax = 0;
    for (const ol of otherLocales) {
      const s = Math.round(computeScore(q, words, normTokens[ol]) * 0.8);
      if (s > otherMax) otherMax = s;
    }

    const score = Math.max(sameLocaleScore, otherMax);
    if (score > 0) {
      scored.push({ product: toFoodProduct(entry, locale), score });
    }
  }

  // Sort by score DESC (stable: entries with equal score keep catalog order)
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.product);
}

/**
 * Look up a single catalog entry by canonical name.
 * Returns a FoodProduct or null if not found.
 */
export function getCatalogProduct(
  canonical: string,
  locale: Locale
): FoodProduct | null {
  const entry = CATALOG.find((e) => e.canonical === canonical);
  if (!entry) return null;
  return toFoodProduct(entry, locale);
}

/** Expose the raw catalog for use in other modules (e.g. vegSageSearch). */
export { CATALOG };
