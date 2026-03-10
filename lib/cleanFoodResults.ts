/**
 * Food result cleaning & validation — Layer 6-8 of the VegSage search architecture.
 *
 * Three responsibilities:
 * 1. isDisqualified(description) — word-based pre-filter on raw USDA descriptions
 * 2. validateNutrition(per100g, category?) — nutritional sanity check
 * 3. rankResults(products) — sort raw > cooked > simple > processed
 */

import type { FoodProduct } from "./usdaClient";
import type { NutrientsPer100g } from "./nutrition";
import type { FoodCategory } from "./foodCatalog";

// ─── 1. Word-based disqualification (applied on raw USDA descriptions) ─────────

/**
 * Words in the USDA description that indicate the item is NOT a plain food
 * (dressings, sauces, industrial mixes, supplements, etc.).
 *
 * Applied on the FIRST comma-segment of the description (main ingredient).
 * "SALAD DRESSING" → segment = "salad dressing" → "dressing" hits list → reject.
 * "LETTUCE, ROMAINE" → segment = "lettuce" → no hit → accept.
 */
export const DISQUALIFYING_WORDS = new Set([
  // Sauces & dressings
  "dressing", "vinaigrette", "sauce", "gravy", "aioli",
  // Industrial mixes & powders
  "seasoning", "mix", "powder", "blend", "spice", "rub",
  "instant", "concentrate", "extract", "base", "bouillon",
  // Supplements & non-food
  "supplement", "formula", "protein shake", "meal replacement",
  "flavoring", "flavour", "flavor",
  // Garnishes
  "crouton", "croutons", "topping", "garnish", "kit",
  // Oils applied to vegetables are salad oils, not vegetables
  "marinade",
]);

/**
 * Returns true if the USDA description should be excluded based on
 * disqualifying compound words in its main ingredient segment.
 *
 * @param description Raw USDA food description (e.g. "SALAD DRESSING, RANCH")
 */
export function isDisqualified(description: string): boolean {
  const mainSegment = description.toLowerCase().split(",")[0].trim();
  const words = mainSegment.split(/\s+/);
  return words.some((w) => DISQUALIFYING_WORDS.has(w));
}

// ─── 2. Nutritional validation ─────────────────────────────────────────────────

/**
 * Categories where calorie density > 800 kcal/100g is physically plausible
 * (e.g. oils = 884 kcal, nuts ≈ 600-700 kcal).
 */
const HIGH_CALORIE_EXCEPTIONS = new Set<FoodCategory>([
  "nut_seed",
  "oil",
]);

/**
 * Validate nutrition values for a food product.
 *
 * Rejects:
 * - calories < 0 (corrupt data)
 * - calories > 800 unless category is nut_seed or oil
 * - protein < 0 or protein > 100 (physiologically impossible)
 *
 * Missing values (null) are never penalized — only confirmed bad values are rejected.
 */
export function validateNutrition(
  per100g: NutrientsPer100g,
  category?: FoodCategory
): boolean {
  const { calories, protein } = per100g;

  if (calories !== null) {
    if (calories < 0) return false;
    const isHighCalOk = category ? HIGH_CALORIE_EXCEPTIONS.has(category) : false;
    if (!isHighCalOk && calories > 800) return false;
  }

  if (protein !== null) {
    if (protein < 0 || protein > 100) return false;
  }

  return true;
}

/**
 * Filter a list of FoodProduct by nutritional validity.
 * Optionally pass a category to allow high-calorie items (oils, nuts).
 */
export function cleanFoodResults(
  products: FoodProduct[],
  category?: FoodCategory
): FoodProduct[] {
  return products.filter((p) => validateNutrition(p.per100g, category));
}

// ─── 3. Result ranking ────────────────────────────────────────────────────────

/**
 * Processing-level rank: lower = better (closer to whole/raw food).
 *
 * 1 — raw / fresh (unprocessed)
 * 2 — simply cooked (boiled, steamed)
 * 3 — roasted / baked / grilled
 * 4 — canned / frozen (preserved whole food)
 * 5 — simple dish (soup, stew)
 * 6 — fried / smoked
 * 7 — unknown processing (no state modifier = plain entry, rank 0)
 */
const STATE_RANK: Record<string, number> = {
  raw:        1,
  fresh:      1,
  boiled:     2,
  steamed:    2,
  cooked:     2,
  roasted:    3,
  baked:      3,
  grilled:    3,
  canned:     4,
  frozen:     4,
  dried:      4,
  dehydrated: 4,
  soup:       5,
  broth:      5,
  stew:       5,
  fried:      6,
  smoked:     6,
};

function processingRank(name: string): number {
  const words = name.toLowerCase().split(/[\s,]+/);
  let rank = 0; // 0 = no state modifier = plain unprocessed food (best)
  for (const w of words) {
    const r = STATE_RANK[w];
    if (r !== undefined && (rank === 0 || r < rank)) {
      rank = r;
    }
  }
  return rank;
}

/**
 * Sort products by processing level: raw > simply cooked > preserved > prepared.
 * Products with no state modifier (plain whole food) always come first (rank 0).
 * Stable sort — equal-ranked items preserve their original order.
 */
export function rankResults(products: FoodProduct[]): FoodProduct[] {
  return [...products].sort(
    (a, b) => processingRank(a.name) - processingRank(b.name)
  );
}
