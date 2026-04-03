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
import { FOOD_CATALOG } from "./foodCatalog";
import { stripAccents } from "./normalizeFoodQuery";

/** Minimum catalog hits before we skip USDA entirely. */
const MIN_CATALOG_ONLY = 3;

/**
 * Match any foodCatalog synonym across all locales (accent-insensitive, exact).
 * Used to resolve a canonical English name for USDA queries when the user types
 * a synonym in any language (e.g. "barre protéinée" → "protein bar").
 */
function matchFoodCatalogEntry(query: string) {
  const q = stripAccents(query.toLowerCase().trim());
  for (const entry of FOOD_CATALOG) {
    for (const loc of ["en", "fr", "de"] as const) {
      if (entry.synonyms[loc].some((s) => stripAccents(s.toLowerCase()) === q)) {
        return entry;
      }
    }
  }
  return null;
}

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

  // Resolve canonical English name via foodCatalog synonyms so USDA gets the right query
  // e.g. "barre protéinée" → "protein bar", "ovomaltine" → "ovomaltine"
  const matchedEntry = matchFoodCatalogEntry(query);
  const usdaQuery = matchedEntry?.canonical ?? query;

  // Layer 2: USDA fallback for unknown / exotic foods
  const usdaLimit = limit - catalogResults.length;
  let usdaResults: FoodProduct[] = [];
  try {
    usdaResults = await searchFoods(usdaQuery, usdaLimit + 5, locale);
  } catch {
    // USDA unavailable — return catalog results only
    return catalogResults;
  }

  // If USDA returned nothing but the query matched a foodCatalog entry, return a stub
  // so catalog foods are always findable even when USDA has no data for them
  const alreadyInCatalog = catalogResults.some(
    (r) => r.off_id === `cat:${matchedEntry?.canonical}`
  );
  if (matchedEntry && usdaResults.length === 0 && !alreadyInCatalog) {
    const localeLabel =
      matchedEntry.synonyms[locale]?.[0] ?? matchedEntry.synonyms.en[0];
    const stub: FoodProduct = {
      off_id: `cat:${matchedEntry.canonical}`,
      name: localeLabel.charAt(0).toUpperCase() + localeLabel.slice(1),
      brand: null,
      per100g: {
        calories: null, protein: null, fat:      null, carbs:    null,
        fiber:    null, sugar:   null, sodium:   null,
        iron:     null, calcium: null, zinc:     null, b12:      null,
        omega3:   null, vitaminC: null, vitaminD: null,
      },
    };
    return [...catalogResults, stub];
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
