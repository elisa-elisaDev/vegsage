/**
 * Local food search index — Layer 2 of the VegSage search architecture.
 *
 * Provides instant, offline food resolution by matching user tokens against
 * a local JSON index before hitting USDA.
 *
 * Two matching strategies:
 * 1. Exact token match  — O(n) scan of the index tokens array
 * 2. Fuzzy match        — Levenshtein distance ≤ threshold (fallback)
 *
 * Returns an array of canonical food names, ranked by match confidence.
 */

import foodIndexData from "../data/foodIndex.json";
import { stripAccents, fuzzyMatch } from "./normalizeFoodQuery";

export interface FoodIndexEntry {
  canonical: string;
  tokens: string[];
  category: string;
}

const FOOD_INDEX = foodIndexData as FoodIndexEntry[];

// Pre-normalise tokens at module load (accent-strip + lowercase)
const NORMALISED_INDEX: Array<{ entry: FoodIndexEntry; normTokens: string[] }> =
  FOOD_INDEX.map((entry) => ({
    entry,
    normTokens: entry.tokens.map((t) => stripAccents(t.toLowerCase())),
  }));

/**
 * Search the local food index for the given query.
 *
 * @param query    User input (any language; will be accent-stripped internally)
 * @param useFuzzy Enable Levenshtein fuzzy matching as fallback (default true)
 * @returns        Array of canonical food names ordered by confidence
 *
 * @example
 * searchFoodIndex("lentilles")  // → ["lentils"]
 * searchFoodIndex("yoghourt")   // → ["yogurt"]
 * searchFoodIndex("linzen")     // → ["lentils"]   (fuzzy: linzen ≈ linsen)
 */
export function searchFoodIndex(
  query: string,
  useFuzzy = true
): string[] {
  if (!query.trim()) return [];

  const q = stripAccents(query.toLowerCase().trim());
  const exactMatches: string[] = [];
  const fuzzyMatches: string[] = [];

  for (const { entry, normTokens } of NORMALISED_INDEX) {
    // 1. Exact token match: query equals one of the tokens
    if (normTokens.some((t) => t === q || q.includes(t) || t.includes(q))) {
      exactMatches.push(entry.canonical);
      continue;
    }

    // 2. Fuzzy match against individual tokens
    if (useFuzzy) {
      if (normTokens.some((t) => fuzzyMatch(q, t))) {
        fuzzyMatches.push(entry.canonical);
      }
    }
  }

  // Exact matches first, fuzzy after — deduplicated
  const seen = new Set<string>();
  const results: string[] = [];
  for (const c of [...exactMatches, ...fuzzyMatches]) {
    if (!seen.has(c)) {
      seen.add(c);
      results.push(c);
    }
  }

  return results;
}

/**
 * Returns the category of a canonical food, or null if not found.
 * Useful for calorie-limit validation in cleanFoodResults.
 */
export function getCategoryFromIndex(canonical: string): string | null {
  return FOOD_INDEX.find((e) => e.canonical === canonical)?.category ?? null;
}
