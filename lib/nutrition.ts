/**
 * Nutrition helpers for VegSage.
 * All values are per 100g internally; scaled by quantity_g at display time.
 *
 * Macro nutrients: calories, protein, fat, carbs, fiber, sugar, sodium
 * Key micronutrients: b12, iron, calcium, omega3, zinc, vitaminD, vitaminC
 */

export interface NutrientsPer100g {
  // Macros
  calories: number | null; // kcal
  protein:  number | null; // g
  fat:      number | null; // g (total fat)
  carbs:    number | null; // g (total carbohydrates)
  fiber:    number | null; // g
  sugar:    number | null; // g
  sodium:   number | null; // mg

  // Key micronutrients for vegetarian tracking
  b12:      number | null; // µg
  iron:     number | null; // mg
  calcium:  number | null; // mg
  omega3:   number | null; // g (ALA)
  zinc:     number | null; // mg
  vitaminD: number | null; // µg  (Premium)
  vitaminC: number | null; // mg  (Premium)
}

export type NutrientKey = keyof NutrientsPer100g;

/** All nutrient keys — macros first, then micros */
export const NUTRIENT_KEYS: NutrientKey[] = [
  "calories",
  "protein",
  "fat",
  "carbs",
  "fiber",
  "sugar",
  "sodium",
  "b12",
  "iron",
  "calcium",
  "omega3",
  "zinc",
  "vitaminD",
  "vitaminC",
];

/** Macro nutrient keys — shown prominently on dashboard */
export const MACRO_KEYS: NutrientKey[] = [
  "calories", "protein", "fat", "carbs", "fiber",
];

/** Micro nutrient keys scored in the VegScore */
export const SCORED_MICRO_KEYS: NutrientKey[] = [
  "b12", "iron", "protein", "calcium", "omega3", "zinc",
];

/** Nutrients shown only to Premium users (not scored, displayed as bonus info) */
export const PREMIUM_NUTRIENT_KEYS: NutrientKey[] = ["vitaminD", "vitaminC"];

/** Human-readable labels for display */
export const NUTRIENT_LABELS: Record<NutrientKey, string> = {
  calories: "Calories",
  protein:  "Protein",
  fat:      "Fat",
  carbs:    "Carbs",
  fiber:    "Fiber",
  sugar:    "Sugar",
  sodium:   "Sodium",
  b12:      "Vitamin B12",
  iron:     "Iron",
  calcium:  "Calcium",
  omega3:   "Omega-3",
  zinc:     "Zinc",
  vitaminD: "Vitamin D",
  vitaminC: "Vitamin C",
};

/** Units for display */
export const NUTRIENT_UNITS: Record<NutrientKey, string> = {
  calories: "kcal",
  protein:  "g",
  fat:      "g",
  carbs:    "g",
  fiber:    "g",
  sugar:    "g",
  sodium:   "mg",
  b12:      "µg",
  iron:     "mg",
  calcium:  "mg",
  omega3:   "g",
  zinc:     "mg",
  vitaminD: "µg",
  vitaminC: "mg",
};

/**
 * Daily reference values.
 * Macros: standard adult reference (2000 kcal diet).
 * Micros: EU/WHO reference values for adult vegetarians.
 * These are defaults; the user's actual goals override them.
 */
export const DAILY_TARGETS: Record<NutrientKey, number> = {
  calories: 2000,
  protein:  50,    // g
  fat:      70,    // g
  carbs:    260,   // g
  fiber:    25,    // g
  sugar:    50,    // g (WHO upper limit)
  sodium:   2000,  // mg (WHO upper limit)
  b12:      2.4,   // µg
  iron:     14,    // mg (EU RDA — vegetarians absorb ~50% less)
  calcium:  1000,  // mg
  omega3:   1.6,   // g ALA
  zinc:     10,    // mg
  vitaminD: 15,    // µg/day (600 IU)
  vitaminC: 90,    // mg/day
};

/**
 * Scale nutrients per 100g to a given quantity.
 * Returns null for any nutrient that was null in per100g.
 */
export function scaleNutrients(
  per100g: NutrientsPer100g,
  quantityG: number
): NutrientsPer100g {
  const factor = quantityG / 100;
  const out: Partial<NutrientsPer100g> = {};
  for (const key of NUTRIENT_KEYS) {
    const v = per100g[key];
    out[key] = v !== null ? v * factor : null;
  }
  return out as NutrientsPer100g;
}

/**
 * Sum an array of nutrient objects (treat null as 0 for summing).
 */
export function sumNutrients(items: NutrientsPer100g[]): NutrientsPer100g {
  const out: Partial<NutrientsPer100g> = {};
  for (const key of NUTRIENT_KEYS) {
    out[key] = items.reduce((acc, item) => {
      const v = item[key];
      return acc + (v ?? 0);
    }, 0);
  }
  return out as NutrientsPer100g;
}

/** Format a number for display */
export function formatNutrient(value: number | null, key: NutrientKey): string {
  if (value === null || !Number.isFinite(value)) return "—";
  if (key === "calories") return Math.round(value).toString();
  if (key === "sodium" || key === "calcium" || key === "iron" || key === "zinc" || key === "vitaminC") return value.toFixed(1);
  if (key === "b12" || key === "vitaminD") return value.toFixed(2);
  return value.toFixed(1);
}

/**
 * User-defined daily goals.
 * Extends DAILY_TARGETS with personalized values stored in the user's profile.
 * Any key not set by the user falls back to DAILY_TARGETS.
 */
export type UserGoals = Partial<Record<NutrientKey, number>>;

export function resolveGoals(userGoals: UserGoals | null): Record<NutrientKey, number> {
  const out: Record<NutrientKey, number> = { ...DAILY_TARGETS };
  if (userGoals) {
    for (const key of NUTRIENT_KEYS) {
      const v = userGoals[key];
      if (typeof v === "number" && v > 0) {
        out[key] = v;
      }
    }
  }
  return out;
}
