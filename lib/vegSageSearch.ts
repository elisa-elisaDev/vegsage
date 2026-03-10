/**
 * VegSage Search Orchestrator — Layer 1 of the new search architecture.
 *
 * Strategy:
 * 1. Search the local catalog (instant, offline) — covers ~100 common vegetarian foods.
 * 2. If the catalog returns ≥ minCatalogResults, return catalog results immediately.
 * 3. Otherwise, augment with USDA FDC results (network fallback).
 * 4. Merge, deduplicate, and return.
 *
 * USDA is now a nutritional enrichment source, not the primary search engine.
 * This makes autocomplete instant and search reliable even without internet.
 */

import type { Locale } from "./i18n";
import type { FoodProduct } from "./usdaClient";
import { searchCatalog } from "./catalogSearch";
import { searchFoods } from "./usdaClient";

/** Minimum catalog hits before we skip USDA entirely. */
const MIN_CATALOG_ONLY = 3;

/**
 * Search for foods: catalog-first, USDA as fallback.
 *
 * @param query    User input (any language, will be normalized internally).
 * @param limit    Max total results.
 * @param locale   Display locale for labels.
 * @returns        Merged, deduplicated FoodProduct array.
 *
 * @example
 * vegSageSearch("lentilles", "fr")   // instant — catalog hit
 * vegSageSearch("exotic grain", "en") // falls through to USDA
 */
export async function vegSageSearch(
  query: string,
  limit: number = 12,
  locale: Locale = "en"
): Promise<FoodProduct[]> {
  if (!query || query.trim().length < 2) return [];

  // Layer 1: instant local catalog search
  const catalogResults = searchCatalog(query, locale, limit);

  // If we have enough catalog results, skip USDA entirely
  if (catalogResults.length >= MIN_CATALOG_ONLY) {
    return catalogResults.slice(0, limit);
  }

  // Layer 2: USDA fallback for unknown / exotic foods
  const usdaLimit = limit - catalogResults.length;
  let usdaResults: FoodProduct[] = [];
  try {
    usdaResults = await searchFoods(query, usdaLimit + 5, locale);
  } catch {
    // USDA unavailable — return catalog results only
    return catalogResults;
  }

  // Deduplicate: catalog results take priority (they have clean nutrition data)
  const seen = new Set<string>(catalogResults.map((p) => p.off_id));
  const merged: FoodProduct[] = [...catalogResults];

  for (const p of usdaResults) {
    if (!seen.has(p.off_id)) {
      seen.add(p.off_id);
      merged.push(p);
    }
    if (merged.length >= limit) break;
  }

  return merged;
}
