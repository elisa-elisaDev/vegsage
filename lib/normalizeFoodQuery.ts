/**
 * Food query normalization — Layer 1 of the VegSage search architecture.
 *
 * Converts any user query (FR / DE / EN, with or without accents, with typos)
 * to the canonical English food name that USDA FoodData Central responds best to.
 *
 * Design:
 * - Alias table keys are accent-stripped, lowercase.
 * - The function strips accents from input before lookup.
 * - "œufs", "oeufs", "Oeufs", "OEUFS" all resolve to "eggs".
 * - Sorted longest-first so "salade verte" matches before "salade".
 */

// ─── Accent stripping ──────────────────────────────────────────────────────────

const ACCENT_REPLACEMENTS: [RegExp, string][] = [
  [/[àâäáã]/g,  "a"],
  [/[èéêë]/g,   "e"],
  [/[îïíì]/g,   "i"],
  [/[ôöóòõ]/g,  "o"],
  [/[ûüúù]/g,   "u"],
  [/ç/g,        "c"],
  [/ñ/g,        "n"],
  [/ß/g,        "ss"],
  [/œ/g,        "oe"],
  [/æ/g,        "ae"],
];

export function stripAccents(s: string): string {
  let r = s;
  for (const [re, rep] of ACCENT_REPLACEMENTS) r = r.replace(re, rep);
  return r;
}

// ─── Alias table ──────────────────────────────────────────────────────────────
// Keys: accent-stripped lowercase. Values: canonical English for USDA search.
// Longest-first so "salade verte" matches before "salade", "thymian" before "thym".

const _ALIASES: [string, string][] = [
  // ── FR multi-word ──────────────────────────────────────────────────────────
  ["salade verte",          "lettuce"],
  ["salade mixte",          "lettuce"],
  ["salade composee",       "lettuce"],
  ["salade de mais",        "corn salad"],
  ["petits pois",           "green peas"],
  ["pois chiches",          "chickpeas"],
  ["haricots verts",        "green beans"],
  ["haricots rouges",       "red kidney beans"],
  ["haricots blancs",       "white beans"],
  ["haricots noirs",        "black beans"],
  ["pommes de terre",       "potatoes"],
  ["patate douce",          "sweet potato"],
  ["patates douces",        "sweet potatoes"],
  ["graines de chia",       "chia seeds"],
  ["graines de lin",        "flaxseeds"],
  ["graines de courge",     "pumpkin seeds"],
  ["graines de tournesol",  "sunflower seeds"],
  ["lait d avoine",         "oat milk"],
  ["lait d amande",         "almond milk"],
  ["lait de coco",          "coconut milk"],
  ["lait de soja",          "soy milk"],
  ["yaourt nature",         "plain yogurt"],
  ["levure nutritionnelle", "nutritional yeast"],
  ["noix de cajou",         "cashews"],
  ["noix de coco",          "coconut"],
  ["huile d olive",         "olive oil"],
  ["huile de coco",         "coconut oil"],
  ["beurre de cacahuete",   "peanut butter"],
  ["beurre d amande",       "almond butter"],
  ["chou rouge",            "red cabbage"],
  ["pois casses",           "split peas"],
  ["pois verts",            "green peas"],
  ["pomme de terre",        "potato"],
  ["celeri rave",           "celeriac"],
  ["mache",                 "corn salad"],
  // ── DE multi-word ──────────────────────────────────────────────────────────
  ["gruner salat",          "lettuce"],
  ["gemischter salat",      "lettuce"],
  ["rote bohnen",           "red kidney beans"],
  ["grune bohnen",          "green beans"],
  ["weisse bohnen",         "white beans"],
  ["schwarze bohnen",       "black beans"],
  ["rote bete",             "beet"],
  ["sussekartoffel",        "sweet potato"],
  ["rosenkohl",             "brussels sprouts"],
  ["grunkohl",              "kale"],
  // ── FR cooking states (multi-word) ────────────────────────────────────────
  ["en conserve",           "canned"],
  ["a la vapeur",           "steamed"],
  ["au four",               "baked"],
  // ── FR single words ────────────────────────────────────────────────────────
  ["oeufs",        "eggs"],       // œufs → oeufs after accent strip
  ["oeuf",         "egg"],        // œuf  → oeuf after accent strip
  ["yoghourt",     "yogurt"],     // alternate spelling
  ["yougourt",     "yogurt"],     // typo
  ["yaourt",       "yogurt"],     // standard French
  ["lentilles",    "lentils"],
  ["lentille",     "lentil"],
  ["salade",       "lettuce"],
  ["laitue",       "lettuce"],
  ["epinards",     "spinach"],
  ["courgettes",   "zucchini"],
  ["courgette",    "zucchini"],
  ["aubergine",    "eggplant"],
  ["poivrons",     "bell peppers"],
  ["poivron",      "bell pepper"],
  ["champignons",  "mushrooms"],
  ["champignon",   "mushroom"],
  ["oignons",      "onions"],
  ["oignon",       "onion"],
  ["carottes",     "carrots"],
  ["carotte",      "carrot"],
  ["tomates",      "tomatoes"],
  ["tomate",       "tomato"],
  ["concombre",    "cucumber"],
  ["chou-fleur",   "cauliflower"],
  ["brocoli",      "broccoli"],
  ["brocolis",     "broccoli"],
  ["celeri",       "celery"],
  ["asperges",     "asparagus"],
  ["asperge",      "asparagus"],
  ["artichaut",    "artichoke"],
  ["poireaux",     "leeks"],
  ["poireau",      "leek"],
  ["radis",        "radish"],
  ["navet",        "turnip"],
  ["betterave",    "beet"],
  ["avocats",      "avocados"],
  ["avocat",       "avocado"],
  ["pommes",       "apples"],
  ["pomme",        "apple"],
  ["poires",       "pears"],
  ["poire",        "pear"],
  ["bananes",      "bananas"],
  ["banane",       "banana"],
  ["fraises",      "strawberries"],
  ["fraise",       "strawberry"],
  ["framboises",   "raspberries"],
  ["framboise",    "raspberry"],
  ["myrtilles",    "blueberries"],
  ["myrtille",     "blueberry"],
  ["raisins",      "grapes"],
  ["raisin",       "grapes"],
  ["cerises",      "cherries"],
  ["cerise",       "cherry"],
  ["peches",       "peaches"],
  ["peche",        "peach"],
  ["abricots",     "apricots"],
  ["abricot",      "apricot"],
  ["mangues",      "mangoes"],
  ["mangue",       "mango"],
  ["ananas",       "pineapple"],
  ["pasteque",     "watermelon"],
  ["melon",        "melon"],
  ["citron",       "lemon"],
  ["oranges",      "oranges"],
  ["orange",       "orange"],
  ["pamplemousse", "grapefruit"],
  ["kiwi",         "kiwi"],
  ["figues",       "figs"],
  ["figue",        "fig"],
  ["dattes",       "dates"],
  ["datte",        "date"],
  ["noix",         "walnuts"],
  ["amandes",      "almonds"],
  ["amande",       "almond"],
  ["noisettes",    "hazelnuts"],
  ["noisette",     "hazelnut"],
  ["cacahuetes",   "peanuts"],
  ["cacahuete",    "peanut"],
  ["riz",          "rice"],
  ["pates",        "pasta"],
  ["avoine",       "oats"],
  ["orge",         "barley"],
  ["sarrasin",     "buckwheat"],
  ["millet",       "millet"],
  ["pain",         "bread"],
  ["farine",       "flour"],
  ["fromage",      "cheese"],
  ["beurre",       "butter"],
  ["creme",        "cream"],
  ["lait",         "milk"],
  ["fenouil",      "fennel"],
  ["persil",       "parsley"],
  ["basilic",      "basil"],
  ["menthe",       "mint"],
  ["thym",         "thyme"],
  ["romarin",      "rosemary"],
  ["coriandre",    "coriander"],
  ["cornichons",   "pickles"],
  ["cornichon",    "pickle"],
  ["soupe",        "soup"],
  ["mais",         "corn"],
  ["surgelees",    "frozen"],
  ["surgeles",     "frozen"],
  ["cuites",       "cooked"],
  ["cuits",        "cooked"],
  ["crue",         "raw"],
  ["cru",          "raw"],
  ["sechees",      "dried"],
  ["seches",       "dried"],
  // ── DE single words ────────────────────────────────────────────────────────
  ["linsen",       "lentils"],
  ["erbsen",       "green peas"],
  ["kichererbsen", "chickpeas"],
  ["spinat",       "spinach"],
  ["brokkoli",     "broccoli"],
  ["blumenkohl",   "cauliflower"],
  ["karotten",     "carrots"],
  ["karotte",      "carrot"],
  ["tomaten",      "tomatoes"],
  ["kartoffeln",   "potatoes"],
  ["kartoffel",    "potato"],
  ["paprika",      "bell pepper"],
  ["pilze",        "mushrooms"],
  ["zwiebeln",     "onions"],
  ["zwiebel",      "onion"],
  ["knoblauch",    "garlic"],
  ["gurke",        "cucumber"],
  ["salat",        "lettuce"],
  ["kurbis",       "pumpkin"],
  ["fenchel",      "fennel"],
  ["mangold",      "swiss chard"],
  ["sojabohnen",   "soybeans"],
  ["eier",         "eggs"],
  ["joghurt",      "yogurt"],
  ["jogurt",       "yogurt"],
  ["milch",        "milk"],
  ["kase",         "cheese"],
  ["butter",       "butter"],
  ["haferflocken", "oatmeal"],
  ["hafer",        "oats"],
  ["reis",         "rice"],
  ["nudeln",       "pasta"],
  ["walnusse",     "walnuts"],
  ["mandeln",      "almonds"],
  ["haselnusse",   "hazelnuts"],
  ["erdnusse",     "peanuts"],
  ["schokolade",   "chocolate"],
  ["honig",        "honey"],
  ["suppe",        "soup"],
  ["essiggurken",  "pickles"],
  ["essiggurke",   "pickle"],
  ["petersilie",   "parsley"],
  ["basilikum",    "basil"],
  ["thymian",      "thyme"],
  ["rosmarin",     "rosemary"],
  ["koriander",    "coriander"],
  ["minze",        "mint"],
  ["tofu",         "tofu"],
  ["tempeh",       "tempeh"],
  ["seitan",       "seitan"],
  ["ei",           "egg"],
  ["gekocht",      "cooked"],
  ["gefroren",     "frozen"],
  ["getrocknet",   "dried"],
  ["roh",          "raw"],
  // ── EN: common user variants / typos ────────────────────────────────────────
  ["yoghrt",       "yogurt"],
  ["linzen",       "lentils"],
  ["lenzen",       "lentils"],
  ["lentile",      "lentils"],
  ["spinache",     "spinach"],
];

// Sort longest-first to guarantee longest match wins
const SORTED_ALIASES = [..._ALIASES].sort((a, b) => b[0].length - a[0].length);

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Normalize a user food query to a canonical English food name.
 *
 * Steps:
 * 1. Lowercase + strip accents  (œufs → oeufs, pêche → peche)
 * 2. Exact phrase match         (oeufs → eggs)
 * 3. Partial phrase replacement (lentilles cuites → lentils cooked)
 * 4. Fallback: accent-stripped form
 *
 * @example
 * normalizeFoodQuery("lentilles")    // → "lentils"
 * normalizeFoodQuery("œufs")        // → "eggs"
 * normalizeFoodQuery("oeufs")       // → "eggs"
 * normalizeFoodQuery("yoghourt")    // → "yogurt"
 * normalizeFoodQuery("salade verte")// → "lettuce"
 * normalizeFoodQuery("fenouil")     // → "fennel"
 */
export function normalizeFoodQuery(query: string): string {
  if (!query.trim()) return "";
  const normalized = stripAccents(query.toLowerCase().trim());

  // 1. Exact full-phrase match (fastest path)
  for (const [alias, canonical] of SORTED_ALIASES) {
    if (normalized === alias) return canonical;
  }

  // 2. Partial phrase replacement — longest match wins, single pass
  let result = normalized;
  for (const [alias, canonical] of SORTED_ALIASES) {
    if (result.includes(alias)) {
      result = result.replace(alias, canonical).trim();
      break;
    }
  }

  return result;
}

// ─── Levenshtein distance ─────────────────────────────────────────────────────

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr: number[] = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    prev = curr;
  }
  return prev[b.length];
}

/**
 * Returns true if `query` is within Levenshtein distance of `target`.
 * Threshold: 1 for ≤5 chars, 2 for ≤8, 3 for longer.
 */
export function fuzzyMatch(query: string, target: string): boolean {
  if (query === target) return true;
  const threshold = query.length <= 5 ? 1 : query.length <= 8 ? 2 : 3;
  return levenshtein(query, target) <= threshold;
}

/**
 * Fuzzy-normalize: if normalizeFoodQuery returns the original query unchanged
 * (no alias matched), try fuzzy matching against all alias keys.
 * Returns the canonical for the best fuzzy match, or the original query.
 */
export function fuzzyNormalizeFoodQuery(query: string): string {
  const direct = normalizeFoodQuery(query);
  // If the query was translated, use that result
  if (direct !== query.toLowerCase().trim() && direct !== stripAccents(query.toLowerCase().trim())) {
    return direct;
  }

  const normalized = stripAccents(query.toLowerCase().trim());
  let bestCanonical: string | null = null;
  let bestDist = Infinity;

  for (const [alias, canonical] of SORTED_ALIASES) {
    const dist = levenshtein(normalized, alias);
    const threshold = normalized.length <= 5 ? 1 : normalized.length <= 8 ? 2 : 3;
    if (dist <= threshold && dist < bestDist) {
      bestDist = dist;
      bestCanonical = canonical;
    }
  }

  return bestCanonical ?? direct;
}
