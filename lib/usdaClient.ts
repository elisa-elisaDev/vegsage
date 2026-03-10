/**
 * USDA FoodData Central API client.
 * Source: https://fdc.nal.usda.gov
 * License: Public domain (U.S. government data)
 * API key: free at https://fdc.nal.usda.gov/api-guide.html
 * Set USDA_FDC_API_KEY in .env.local (falls back to DEMO_KEY if unset).
 */

import type { NutrientsPer100g } from "./nutrition";
import { normalizeFoodQuery } from "./normalizeFoodQuery";
import { foodCache } from "./foodCache";
import { isDisqualified, validateNutrition, rankResults } from "./cleanFoodResults";
import { getCatalogEntry } from "./foodCatalog";

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";

function getApiKey(): string {
  return process.env.USDA_FDC_API_KEY || "DEMO_KEY";
}

// USDA FDC nutrient IDs → NutrientsPer100g keys.
// Each key lists IDs in priority order: first match wins in parseNutrients().
// Multiple IDs per key cover different USDA data types (SR Legacy / Foundation /
// Branded / Survey) which sometimes report the same nutrient under different IDs.
const NUTRIENT_ID_MAP: Record<keyof NutrientsPer100g, number[]> = {
  // Energy: 1008 = Atwater general (SR Legacy/Branded)
  //         2047 = Atwater specific factors (Foundation/Survey)
  //         2048 = Energy excl. fiber (some Foundation foods)
  calories: [1008, 2047, 2048],

  protein:  [1003],           // Protein (G)

  // Macros
  fat:      [1004],           // Total lipid (fat) (G)
  carbs:    [1005],           // Carbohydrate, by difference (G)
  fiber:    [1079],           // Fiber, total dietary (G)
  sugar:    [2000, 1063],     // Sugars total / Sugars, by difference (G)
  sodium:   [1093],           // Sodium, Na (MG)

  // Micronutrients
  calcium:  [1087],           // Calcium, Ca (MG)
  iron:     [1089],           // Iron, Fe (MG)
  zinc:     [1095],           // Zinc, Zn (MG)
  b12:      [1178],           // Vitamin B-12 (UG)

  // Omega-3: 1588 = ALA (18:3 n-3 c,c,c), 1404 = Total omega-3
  omega3:   [1588, 1404],

  // Vitamin D: 1114 = D2+D3 combined, 1110 = D2, 1112 = D3
  vitaminD: [1114, 1110, 1112],

  vitaminC: [1162],           // Vitamin C, total ascorbic acid (MG)
};

// Flat, deduplicated list of all IDs — used as repeated API params (one per ID).
// The USDA API spec requires repeated params: nutrients=1008&nutrients=1003&...
// NOT comma-separated: nutrients=1008,1003,... (that format is silently ignored).
const ALL_NUTRIENT_IDS = [...new Set(Object.values(NUTRIENT_ID_MAP).flat())];

// Cache is delegated to lib/foodCache.ts (TTL = 5 min, shared singleton).

export interface FoodProduct {
  /** Catalog canonical key (cat:xxx) or USDA fdcId */
  off_id: string;
  name: string;
  brand?: string | null;
  per100g: NutrientsPer100g;
}

// ─── Query translation (FR / DE → EN) ────────────────────────────────────────
// Moved to lib/normalizeFoodQuery.ts — handles accent stripping, typos, and
// multi-word phrases. Call normalizeFoodQuery(query) instead of translateFoodQuery.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _FOOD_TRANSLATIONS_REMOVED: [string, string][] = [
  // ── French multi-word phrases ──────────────────────────────────────────────
  ["salade verte",          "salad"],
  ["salade mixte",          "salad"],
  ["salade composée",       "salad"],
  ["salade de maïs",        "corn salad"],
  ["mâche",                 "corn salad"],
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
  ["lait d'avoine",         "oat milk"],
  ["lait d'amande",         "almond milk"],
  ["lait de coco",          "coconut milk"],
  ["lait de soja",          "soy milk"],
  ["yaourt nature",         "plain yogurt"],
  ["levure nutritionnelle", "nutritional yeast"],
  ["noix de cajou",         "cashews"],
  ["noix de coco",          "coconut"],
  ["huile d'olive",         "olive oil"],
  ["huile de coco",         "coconut oil"],
  ["beurre de cacahuète",   "peanut butter"],
  ["beurre d'amande",       "almond butter"],
  ["chou rouge",            "red cabbage"],
  ["pois cassés",           "split peas"],
  ["pois verts",            "green peas"],
  ["pomme de terre",        "potato"],
  ["céleri-rave",           "celeriac"],
  // ── French cooking states (multi-word) ────────────────────────────────────
  ["en conserve",           "canned"],
  ["à la vapeur",           "steamed"],
  ["au four",               "baked"],
  // ── French single words ────────────────────────────────────────────────────
  ["épinards",   "spinach"],
  ["courgettes", "zucchini"],
  ["courgette",  "zucchini"],
  ["aubergine",  "eggplant"],
  ["poivron",    "bell pepper"],
  ["poivrons",   "bell peppers"],
  ["champignons","mushrooms"],
  ["champignon", "mushroom"],
  ["oignons",    "onions"],
  ["oignon",     "onion"],
  ["carottes",   "carrots"],
  ["carotte",    "carrot"],
  ["tomates",    "tomatoes"],
  ["tomate",     "tomato"],
  ["concombre",  "cucumber"],
  ["laitue",     "lettuce"],
  ["salade",     "salad"],
  ["chou-fleur", "cauliflower"],
  ["brocoli",    "broccoli"],
  ["céleri",     "celery"],
  ["asperges",   "asparagus"],
  ["asperge",    "asparagus"],
  ["artichaut",  "artichoke"],
  ["poireaux",   "leeks"],
  ["poireau",    "leek"],
  ["radis",      "radish"],
  ["navet",      "turnip"],
  ["betterave",  "beet"],
  ["avocat",     "avocado"],
  ["avocats",    "avocados"],
  ["pomme",      "apple"],
  ["pommes",     "apples"],
  ["poire",      "pear"],
  ["poires",     "pears"],
  ["banane",     "banana"],
  ["bananes",    "bananas"],
  ["fraise",     "strawberry"],
  ["fraises",    "strawberries"],
  ["framboise",  "raspberry"],
  ["framboises", "raspberries"],
  ["myrtille",   "blueberry"],
  ["myrtilles",  "blueberries"],
  ["raisin",     "grapes"],
  ["raisins",    "grapes"],
  ["cerise",     "cherry"],
  ["cerises",    "cherries"],
  ["pêche",      "peach"],
  ["pêches",     "peaches"],
  ["abricot",    "apricot"],
  ["abricots",   "apricots"],
  ["mangue",     "mango"],
  ["mangues",    "mangoes"],
  ["ananas",     "pineapple"],
  ["pastèque",   "watermelon"],
  ["melon",      "melon"],
  ["citron",     "lemon"],
  ["orange",     "orange"],
  ["oranges",    "oranges"],
  ["pamplemousse","grapefruit"],
  ["kiwi",       "kiwi"],
  ["figue",      "fig"],
  ["figues",     "figs"],
  ["datte",      "date"],
  ["dattes",     "dates"],
  ["lentilles",  "lentils"],
  ["fèves",      "fava beans"],
  ["soja",       "soybeans"],
  ["edamame",    "edamame"],
  ["tofu",       "tofu"],
  ["tempeh",     "tempeh"],
  ["seitan",     "seitan"],
  ["riz",        "rice"],
  ["pâtes",      "pasta"],
  ["quinoa",     "quinoa"],
  ["avoine",     "oats"],
  ["orge",       "barley"],
  ["sarrasin",   "buckwheat"],
  ["millet",     "millet"],
  ["maïs",       "corn"],
  ["pain",       "bread"],
  ["farine",     "flour"],
  ["fromage",    "cheese"],
  ["yaourt",     "yogurt"],
  ["lait",       "milk"],
  ["beurre",     "butter"],
  ["crème",      "cream"],
  ["œufs",       "eggs"],
  ["œuf",        "egg"],
  ["miel",       "honey"],
  ["sucre",      "sugar"],
  ["noix",       "walnuts"],
  ["amandes",    "almonds"],
  ["amande",     "almond"],
  ["noisettes",  "hazelnuts"],
  ["noisette",   "hazelnut"],
  ["arachides",  "peanuts"],
  ["cacahuètes", "peanuts"],
  ["chocolat",   "chocolate"],
  ["tahini",     "tahini"],
  ["houmous",    "hummus"],
  ["épinard",    "spinach"],
  ["fenouil",    "fennel"],
  ["chou",       "cabbage"],
  ["panais",     "parsnip"],
  ["blette",     "swiss chard"],
  ["bette",      "swiss chard"],
  ["persil",     "parsley"],
  ["coriandre",  "coriander"],
  ["basilic",    "basil"],
  ["thym",       "thyme"],
  ["romarin",    "rosemary"],
  ["menthe",     "mint"],
  ["courge",     "squash"],
  ["citrouille", "pumpkin"],
  // ── French cooking states (single word) ───────────────────────────────────
  ["surgelées",  "frozen"],
  ["surgelés",   "frozen"],
  ["séchées",    "dried"],
  ["séchés",     "dried"],
  ["cuites",     "cooked"],
  ["cuits",      "cooked"],
  ["crue",       "raw"],
  ["cru",        "raw"],
  // ── French other ──────────────────────────────────────────────────────────
  ["soupe",      "soup"],
  ["cornichons", "pickles"],
  ["cornichon",  "pickle"],
  // ── German multi-word phrases ──────────────────────────────────────────────
  ["grüner salat",       "salad"],
  ["gemischter salat",   "salad"],
  ["grüne bohnen",       "green beans"],
  ["rote bohnen",        "red kidney beans"],
  ["weiße bohnen",       "white beans"],
  ["schwarze bohnen",    "black beans"],
  ["süßkartoffel",       "sweet potato"],
  ["süßkartoffeln",      "sweet potatoes"],
  ["chiasamen",          "chia seeds"],
  ["leinsamen",          "flaxseeds"],
  ["kürbiskerne",        "pumpkin seeds"],
  ["sonnenblumenkerne",  "sunflower seeds"],
  ["hafermilch",         "oat milk"],
  ["mandelmilch",        "almond milk"],
  ["kokosmilch",         "coconut milk"],
  ["sojamilch",          "soy milk"],
  ["erdnussbutter",      "peanut butter"],
  ["mandelmus",          "almond butter"],
  ["nährhefe",           "nutritional yeast"],
  ["hefeflocken",        "nutritional yeast"],
  // ── German single words ────────────────────────────────────────────────────
  ["spinat",         "spinach"],
  ["zucchini",       "zucchini"],
  ["aubergine",      "eggplant"],
  ["paprika",        "bell pepper"],
  ["champignons",    "mushrooms"],
  ["pilze",          "mushrooms"],
  ["zwiebeln",       "onions"],
  ["zwiebel",        "onion"],
  ["karotten",       "carrots"],
  ["karotte",        "carrot"],
  ["möhren",         "carrots"],
  ["tomaten",        "tomatoes"],
  ["tomate",         "tomato"],
  ["gurke",          "cucumber"],
  ["kopfsalat",      "lettuce"],
  ["salat",          "lettuce"],
  ["blumenkohl",     "cauliflower"],
  ["brokkoli",       "broccoli"],
  ["sellerie",       "celery"],
  ["spargel",        "asparagus"],
  ["lauch",          "leek"],
  ["radieschen",     "radish"],
  ["rübe",           "turnip"],
  ["rote bete",      "beet"],
  ["avocado",        "avocado"],
  ["apfel",          "apple"],
  ["äpfel",          "apples"],
  ["birne",          "pear"],
  ["birnen",         "pears"],
  ["banane",         "banana"],
  ["bananen",        "bananas"],
  ["erdbeere",       "strawberry"],
  ["erdbeeren",      "strawberries"],
  ["himbeere",       "raspberry"],
  ["himbeeren",      "raspberries"],
  ["heidelbeere",    "blueberry"],
  ["heidelbeeren",   "blueberries"],
  ["weintrauben",    "grapes"],
  ["kirsche",        "cherry"],
  ["kirschen",       "cherries"],
  ["pfirsich",       "peach"],
  ["aprikose",       "apricot"],
  ["mango",          "mango"],
  ["ananas",         "pineapple"],
  ["wassermelone",   "watermelon"],
  ["zitrone",        "lemon"],
  ["orangen",        "oranges"],
  ["grapefruit",     "grapefruit"],
  ["feige",          "fig"],
  ["feigen",         "figs"],
  ["dattel",         "date"],
  ["datteln",        "dates"],
  ["linsen",         "lentils"],
  ["erbsen",         "peas"],
  ["kichererbsen",   "chickpeas"],
  ["bohnen",         "beans"],
  ["sojabohnen",     "soybeans"],
  ["tofu",           "tofu"],
  ["tempeh",         "tempeh"],
  ["seitan",         "seitan"],
  ["reis",           "rice"],
  ["nudeln",         "pasta"],
  ["quinoa",         "quinoa"],
  ["hafer",          "oats"],
  ["haferflocken",   "oatmeal"],
  ["gerste",         "barley"],
  ["buchweizen",     "buckwheat"],
  ["hirse",          "millet"],
  ["mais",           "corn"],
  ["brot",           "bread"],
  ["mehl",           "flour"],
  ["käse",           "cheese"],
  ["joghurt",        "yogurt"],
  ["milch",          "milk"],
  ["butter",         "butter"],
  ["eier",           "eggs"],
  ["ei",             "egg"],
  ["honig",          "honey"],
  ["zucker",         "sugar"],
  ["walnüsse",       "walnuts"],
  ["mandeln",        "almonds"],
  ["haselnüsse",     "hazelnuts"],
  ["erdnüsse",       "peanuts"],
  ["cashews",        "cashews"],
  ["schokolade",     "chocolate"],
  ["kokos",          "coconut"],
  ["fenchel",        "fennel"],
  ["rosenkohl",      "brussels sprouts"],
  ["rotkohl",        "red cabbage"],
  ["grünkohl",       "kale"],
  ["kürbis",         "pumpkin"],
  ["kartoffeln",     "potatoes"],
  ["kartoffel",      "potato"],
  ["petersilie",     "parsley"],
  ["koriander",      "coriander"],
  ["basilikum",      "basil"],
  ["thymian",        "thyme"],
  ["rosmarin",       "rosemary"],
  ["minze",          "mint"],
  ["mangold",        "swiss chard"],
  ["pastinake",      "parsnip"],
  // ── German cooking states ─────────────────────────────────────────────────
  ["suppe",          "soup"],
  ["essiggurken",    "pickles"],
  ["essiggurke",     "pickle"],
  ["gekocht",        "cooked"],
  ["gefroren",       "frozen"],
  ["getrocknet",     "dried"],
  ["roh",            "raw"],
];

// Translation logic moved to lib/normalizeFoodQuery.ts.

// ─── Category synonym expansion (Mode B) ────────────────────────────────────
// When the pivot term matches a key here, pivot matching is relaxed to accept
// any of the synonyms in USDA descriptions. Step 5b (post-localization filter)
// is also disabled for these queries since there is no single canonical label.
// Mode A (precise ingredients like "lentils", "tofu") keeps strict pivot logic.
const CATEGORY_SYNONYMS: Record<string, readonly string[]> = {
  "salad":  ["salad", "lettuce", "romaine", "iceberg", "arugula", "endive", "radicchio", "greens", "mixed"],
  "greens": ["greens", "spinach", "kale", "lettuce", "chard", "arugula", "endive", "collards"],
  "soup":   ["soup", "broth", "stew", "bisque", "chowder", "potage", "veloute"],
};

// Words in the main-ingredient segment that disqualify a category result.
// "SALAD DRESSING" → "dressing" hits this list → rejected before any further processing.
// "SALAD OIL"      → "oil"      hits this list → rejected.
// Applied in step 1b only for Mode B (category) queries.
const CATEGORY_EXCLUSIONS: Record<string, readonly string[]> = {
  "salad":  ["dressing", "oil", "sauce", "topping", "crouton", "croutons", "marinade", "vinaigrette", "kit"],
  "greens": ["dressing", "oil", "sauce"],
  "soup":   ["mix", "powder", "concentrate", "base", "bouillon"],
};

// Upper calorie ceiling (kcal / 100g) for category queries.
// A plain leafy-green salad physically cannot have 400 kcal — that entry is a dressing
// or processed composite that slipped through the text filter.
// Missing calorie data (null) is NOT penalized — only confirmed excess is rejected.
const CATEGORY_MAX_CALORIES: Record<string, number> = {
  "salad":  150,
  "greens": 100,
};

// Words to skip when computing the pivot from the translated English query.
// "lentils cooked" → skip "cooked" → pivot "lentils"
// "green peas frozen" → skip "frozen" → pivot "peas"
// Prevents cooking-state adjectives from becoming the pivot and producing 0 results.
const _PIVOT_SKIP = new Set([
  "raw", "fresh", "cooked", "frozen", "canned", "dried", "boiled",
  "steamed", "roasted", "baked", "grilled", "fried", "smoked",
  "dehydrated", "whole", "sliced", "diced", "chopped",
]);

// translateFoodQuery removed — use normalizeFoodQuery from lib/normalizeFoodQuery.ts

// ─── Vegetarian relevance filter ─────────────────────────────────────────────
// Words that indicate non-vegetarian or irrelevant content for this app.
// Applied as whole-word substring checks on the food description (lowercase).
const NON_VEG_WORDS = [
  // Meat & poultry
  "beef", "chicken", "pork", "turkey", "ham", "bacon", "veal", "lamb",
  "duck", "goose", "venison", "bison", "rabbit", "mutton", "prosciutto",
  "pepperoni", "salami", "chorizo", "sausage", "hot dog", "hotdog",
  "lard", "suet", "gelatin",
  // Seafood
  "fish", "salmon", "tuna", "cod", "tilapia", "trout", "halibut", "herring",
  "sardine", "anchovy", "mackerel", "bass", "snapper", "mahi",
  "shrimp", "lobster", "crab", "oyster", "mussel", "clam", "scallop",
  "squid", "octopus", "caviar",
  // Alcohol
  "beer", "ale", "lager", "stout", "porter", "cider",
  "wine", "champagne", "prosecco",
  "whiskey", "whisky", "vodka", "rum", "gin", "tequila", "brandy",
  "bourbon", "scotch", "liqueur", "mead",
  // Irrelevant categories for a food-intake tracker
  "infant formula", "baby food", "dog food", "cat food", "pet food",
  "tobacco", "cigarette",
];

function isVegetarianRelevant(description: string): boolean {
  const lower = description.toLowerCase();
  for (const word of NON_VEG_WORDS) {
    // Use word-boundary-like check: surrounded by space/punctuation or at start/end
    const idx = lower.indexOf(word);
    if (idx === -1) continue;
    const before = idx === 0 ? " " : lower[idx - 1];
    const after  = idx + word.length >= lower.length ? " " : lower[idx + word.length];
    const boundary = /[\s,()[\]/-]/;
    if (boundary.test(before) || before === " " || idx === 0) {
      if (boundary.test(after) || after === " " || idx + word.length >= lower.length) {
        return false;
      }
    }
  }
  return true;
}

// ─── Deduplication ───────────────────────────────────────────────────────────
// USDA returns many near-identical entries for the same food.
// Strategy: 2-tier key = sorted(core_words) + "|" + sorted(state_words)
//   • STATE words (frozen, canned, cooked…) are kept in the key → distinct entries
//   • NOISE words (organic, raw, light…) are discarded → collapsed to same key
// Examples:
//   "GREEN PEAS"            → key "green peas"
//   "GREEN PEAS" (brand 2) → key "green peas"          ← deduplicated ✓
//   "PEAS, GREEN"           → key "green peas"          ← deduplicated ✓
//   "PEAS, GREEN, FROZEN"   → key "green peas|frozen"   ← kept distinct ✓
//   "PEAS, GREEN, CANNED"   → key "green peas|canned"   ← kept distinct ✓
//   "SUGAR SNAP PEAS"       → key "peas snap sugar"     ← kept distinct ✓

// These words create meaningfully distinct food entries (different nutrition profile)
const DEDUP_STATE_WORDS = new Set([
  "frozen","canned","cooked","boiled","steamed","fried","roasted",
  "baked","grilled","dried","dehydrated","smoked",
]);

// These words are irrelevant to food identity — remove from key entirely
const DEDUP_NOISE_WORDS = new Set([
  "a","an","the","in","of","and","or","with","without","no","not",
  "organic","natural","pure","real","plain","original","classic","regular",
  "light","lite","low","reduced","free","zero","fat",
  "enriched","fortified","added","instant","quick","raw","fresh","dry",
  "large","small","medium","mini","baby","super","extra",
  "unsalted","salted","sweetened","unsweetened","flavored","unflavored",
  "drained","rinsed","washed","unprepared","prepared",
  "concentrated","reconstituted","defatted","separated","mature",
]);

function dedupeKey(description: string): string {
  const words = description
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);

  const core  = [...new Set(words.filter((w) => !DEDUP_STATE_WORDS.has(w) && !DEDUP_NOISE_WORDS.has(w)))].sort();
  const state = [...new Set(words.filter((w) => DEDUP_STATE_WORDS.has(w)))].sort();

  return state.length ? `${core.join(" ")}|${state.join(" ")}` : core.join(" ");
}

// ─── Food localization ────────────────────────────────────────────────────────
// Maps English canonical food names to localized display labels.
// Lookup key = sorted words of the English name (matching the coreKey of dedupeKey).
// State modifiers (frozen, canned…) are appended via STATE_LABELS.

type FoodLocale = "en" | "fr" | "de";
type LocaleMap = { en: string; fr: string; de: string };

const STATE_LABELS: Record<string, LocaleMap> = {
  frozen:      { en: "frozen",      fr: "surgelés",      de: "gefroren"     },
  canned:      { en: "canned",      fr: "en conserve",   de: "aus der Dose" },
  cooked:      { en: "cooked",      fr: "cuits",         de: "gekocht"      },
  boiled:      { en: "boiled",      fr: "bouillis",      de: "gekocht"      },
  steamed:     { en: "steamed",     fr: "à la vapeur",   de: "gedünstet"    },
  roasted:     { en: "roasted",     fr: "rôtis",         de: "geröstet"     },
  baked:       { en: "baked",       fr: "au four",       de: "gebacken"     },
  grilled:     { en: "grilled",     fr: "grillés",       de: "gegrillt"     },
  fried:       { en: "fried",       fr: "frits",         de: "gebraten"     },
  dried:       { en: "dried",       fr: "séchés",        de: "getrocknet"   },
  dehydrated:  { en: "dehydrated",  fr: "déshydratés",   de: "dehydriert"   },
  smoked:      { en: "smoked",      fr: "fumés",         de: "geräuchert"   },
};

// [englishName, { en, fr, de }] — key is computed from sorted words of englishName
const _FOOD_NAME_DATA: [string, LocaleMap][] = [
  // ── Legumes ────────────────────────────────────────────────────────────────
  ["green peas",        { en: "Green Peas",         fr: "Petits pois",          de: "Erbsen"             }],
  ["chickpeas",         { en: "Chickpeas",          fr: "Pois chiches",         de: "Kichererbsen"       }],
  ["lentils",           { en: "Lentils",            fr: "Lentilles",            de: "Linsen"             }],
  ["green beans",       { en: "Green Beans",        fr: "Haricots verts",       de: "Grüne Bohnen"       }],
  ["red kidney beans",  { en: "Red Kidney Beans",   fr: "Haricots rouges",      de: "Rote Bohnen"        }],
  ["white beans",       { en: "White Beans",        fr: "Haricots blancs",      de: "Weiße Bohnen"       }],
  ["black beans",       { en: "Black Beans",        fr: "Haricots noirs",       de: "Schwarze Bohnen"    }],
  ["soybeans",          { en: "Soybeans",           fr: "Soja",                 de: "Sojabohnen"         }],
  ["edamame",           { en: "Edamame",            fr: "Edamame",              de: "Edamame"            }],
  ["snap peas",         { en: "Snap Peas",          fr: "Pois mange-tout",      de: "Zuckerschoten"      }],
  ["fava beans",        { en: "Fava Beans",         fr: "Fèves",                de: "Saubohnen"          }],
  // ── Vegetables ─────────────────────────────────────────────────────────────
  ["spinach",           { en: "Spinach",            fr: "Épinards",             de: "Spinat"             }],
  ["broccoli",          { en: "Broccoli",           fr: "Brocoli",              de: "Brokkoli"           }],
  ["cauliflower",       { en: "Cauliflower",        fr: "Chou-fleur",           de: "Blumenkohl"         }],
  ["carrots",           { en: "Carrots",            fr: "Carottes",             de: "Karotten"           }],
  ["tomatoes",          { en: "Tomatoes",           fr: "Tomates",              de: "Tomaten"            }],
  ["potatoes",          { en: "Potatoes",           fr: "Pommes de terre",      de: "Kartoffeln"         }],
  ["sweet potato",      { en: "Sweet Potato",       fr: "Patate douce",         de: "Süßkartoffel"       }],
  ["zucchini",          { en: "Zucchini",           fr: "Courgettes",           de: "Zucchini"           }],
  ["eggplant",          { en: "Eggplant",           fr: "Aubergine",            de: "Aubergine"          }],
  ["bell pepper",       { en: "Bell Pepper",        fr: "Poivron",              de: "Paprika"            }],
  ["mushrooms",         { en: "Mushrooms",          fr: "Champignons",          de: "Champignons"        }],
  ["onions",            { en: "Onions",             fr: "Oignons",              de: "Zwiebeln"           }],
  ["garlic",            { en: "Garlic",             fr: "Ail",                  de: "Knoblauch"          }],
  ["avocado",           { en: "Avocado",            fr: "Avocat",               de: "Avocado"            }],
  ["cucumber",          { en: "Cucumber",           fr: "Concombre",            de: "Gurke"              }],
  ["lettuce",           { en: "Lettuce",            fr: "Laitue",               de: "Salat"              }],
  ["salad",             { en: "Salad",              fr: "Salade",               de: "Salat"              }],
  ["romaine",           { en: "Romaine Lettuce",    fr: "Laitue romaine",       de: "Römersalat"         }],
  ["iceberg",           { en: "Iceberg Lettuce",    fr: "Laitue iceberg",       de: "Eisbergsalat"       }],
  ["arugula",           { en: "Arugula",            fr: "Roquette",             de: "Rucola"             }],
  ["endive",            { en: "Endive",             fr: "Endive",               de: "Chicorée"           }],
  ["radicchio",         { en: "Radicchio",          fr: "Radicchio",            de: "Radicchio"          }],
  ["celery",            { en: "Celery",             fr: "Céleri",               de: "Sellerie"           }],
  ["asparagus",         { en: "Asparagus",          fr: "Asperges",             de: "Spargel"            }],
  ["leek",              { en: "Leek",               fr: "Poireau",              de: "Lauch"              }],
  ["beet",              { en: "Beet",               fr: "Betterave",            de: "Rote Bete"          }],
  ["corn",              { en: "Corn",               fr: "Maïs",                 de: "Mais"               }],
  ["kale",              { en: "Kale",               fr: "Chou kale",            de: "Grünkohl"           }],
  ["cabbage",           { en: "Cabbage",            fr: "Chou",                 de: "Kohl"               }],
  ["artichoke",         { en: "Artichoke",          fr: "Artichaut",            de: "Artischocke"        }],
  ["radish",            { en: "Radish",             fr: "Radis",                de: "Radieschen"         }],
  ["turnip",            { en: "Turnip",             fr: "Navet",                de: "Rübe"               }],
  ["pumpkin",           { en: "Pumpkin",            fr: "Citrouille",           de: "Kürbis"             }],
  // ── Fruits ─────────────────────────────────────────────────────────────────
  ["apple",             { en: "Apple",              fr: "Pomme",                de: "Apfel"              }],
  ["banana",            { en: "Banana",             fr: "Banane",               de: "Banane"             }],
  ["orange",            { en: "Orange",             fr: "Orange",               de: "Orange"             }],
  ["strawberry",        { en: "Strawberry",         fr: "Fraise",               de: "Erdbeere"           }],
  ["blueberry",         { en: "Blueberry",          fr: "Myrtille",             de: "Heidelbeere"        }],
  ["raspberry",         { en: "Raspberry",          fr: "Framboise",            de: "Himbeere"           }],
  ["mango",             { en: "Mango",              fr: "Mangue",               de: "Mango"              }],
  ["pineapple",         { en: "Pineapple",          fr: "Ananas",               de: "Ananas"             }],
  ["grapes",            { en: "Grapes",             fr: "Raisins",              de: "Weintrauben"        }],
  ["lemon",             { en: "Lemon",              fr: "Citron",               de: "Zitrone"            }],
  ["peach",             { en: "Peach",              fr: "Pêche",                de: "Pfirsich"           }],
  ["pear",              { en: "Pear",               fr: "Poire",                de: "Birne"              }],
  ["cherry",            { en: "Cherry",             fr: "Cerise",               de: "Kirsche"            }],
  ["kiwi",              { en: "Kiwi",               fr: "Kiwi",                 de: "Kiwi"               }],
  ["fig",               { en: "Fig",                fr: "Figue",                de: "Feige"              }],
  ["date",              { en: "Date",               fr: "Datte",                de: "Dattel"             }],
  ["coconut",           { en: "Coconut",            fr: "Noix de coco",         de: "Kokos"              }],
  ["watermelon",        { en: "Watermelon",         fr: "Pastèque",             de: "Wassermelone"       }],
  ["melon",             { en: "Melon",              fr: "Melon",                de: "Melone"             }],
  // ── Plant proteins ─────────────────────────────────────────────────────────
  ["tofu",              { en: "Tofu",               fr: "Tofu",                 de: "Tofu"               }],
  ["tempeh",            { en: "Tempeh",             fr: "Tempeh",               de: "Tempeh"             }],
  ["seitan",            { en: "Seitan",             fr: "Seitan",               de: "Seitan"             }],
  // ── Grains & starches ──────────────────────────────────────────────────────
  ["rice",              { en: "Rice",               fr: "Riz",                  de: "Reis"               }],
  ["pasta",             { en: "Pasta",              fr: "Pâtes",                de: "Nudeln"             }],
  ["oats",              { en: "Oats",               fr: "Avoine",               de: "Hafer"              }],
  ["quinoa",            { en: "Quinoa",             fr: "Quinoa",               de: "Quinoa"             }],
  ["bread",             { en: "Bread",              fr: "Pain",                 de: "Brot"               }],
  ["flour",             { en: "Flour",              fr: "Farine",               de: "Mehl"               }],
  ["barley",            { en: "Barley",             fr: "Orge",                 de: "Gerste"             }],
  ["buckwheat",         { en: "Buckwheat",          fr: "Sarrasin",             de: "Buchweizen"         }],
  ["millet",            { en: "Millet",             fr: "Millet",               de: "Hirse"              }],
  // ── Dairy & eggs ───────────────────────────────────────────────────────────
  ["milk",              { en: "Milk",               fr: "Lait",                 de: "Milch"              }],
  ["cheese",            { en: "Cheese",             fr: "Fromage",              de: "Käse"               }],
  ["yogurt",            { en: "Yogurt",             fr: "Yaourt",               de: "Joghurt"            }],
  ["butter",            { en: "Butter",             fr: "Beurre",               de: "Butter"             }],
  ["eggs",              { en: "Eggs",               fr: "Œufs",                 de: "Eier"               }],
  ["cream",             { en: "Cream",              fr: "Crème",                de: "Sahne"              }],
  // ── Plant milks ────────────────────────────────────────────────────────────
  ["oat milk",          { en: "Oat Milk",           fr: "Lait d'avoine",        de: "Hafermilch"         }],
  ["almond milk",       { en: "Almond Milk",        fr: "Lait d'amande",        de: "Mandelmilch"        }],
  ["soy milk",          { en: "Soy Milk",           fr: "Lait de soja",         de: "Sojamilch"          }],
  ["coconut milk",      { en: "Coconut Milk",       fr: "Lait de coco",         de: "Kokosmilch"         }],
  // ── Nuts & seeds ───────────────────────────────────────────────────────────
  ["walnuts",           { en: "Walnuts",            fr: "Noix",                 de: "Walnüsse"           }],
  ["almonds",           { en: "Almonds",            fr: "Amandes",              de: "Mandeln"            }],
  ["cashews",           { en: "Cashews",            fr: "Noix de cajou",        de: "Cashews"            }],
  ["peanuts",           { en: "Peanuts",            fr: "Cacahuètes",           de: "Erdnüsse"           }],
  ["pumpkin seeds",     { en: "Pumpkin Seeds",      fr: "Graines de courge",    de: "Kürbiskerne"        }],
  ["chia seeds",        { en: "Chia Seeds",         fr: "Graines de chia",      de: "Chiasamen"          }],
  ["flaxseeds",         { en: "Flaxseeds",          fr: "Graines de lin",       de: "Leinsamen"          }],
  ["sunflower seeds",   { en: "Sunflower Seeds",    fr: "Graines de tournesol", de: "Sonnenblumenkerne"  }],
  ["hazelnuts",         { en: "Hazelnuts",          fr: "Noisettes",            de: "Haselnüsse"         }],
  // ── Condiments & others ────────────────────────────────────────────────────
  ["olive oil",         { en: "Olive Oil",          fr: "Huile d'olive",        de: "Olivenöl"           }],
  ["peanut butter",     { en: "Peanut Butter",      fr: "Beurre de cacahuète",  de: "Erdnussbutter"      }],
  ["almond butter",     { en: "Almond Butter",      fr: "Beurre d'amande",      de: "Mandelmus"          }],
  ["tahini",            { en: "Tahini",             fr: "Tahini",               de: "Tahini"             }],
  ["hummus",            { en: "Hummus",             fr: "Houmous",              de: "Hummus"             }],
  ["nutritional yeast", { en: "Nutritional Yeast",  fr: "Levure nutritionnelle",de: "Hefeflocken"        }],
  ["honey",             { en: "Honey",              fr: "Miel",                 de: "Honig"              }],
  ["chocolate",         { en: "Chocolate",          fr: "Chocolat",             de: "Schokolade"         }],
  // ── Herbs & aromatics ──────────────────────────────────────────────────────
  ["fennel",            { en: "Fennel",             fr: "Fenouil",              de: "Fenchel"            }],
  ["parsley",           { en: "Parsley",            fr: "Persil",               de: "Petersilie"         }],
  ["basil",             { en: "Basil",              fr: "Basilic",              de: "Basilikum"          }],
  ["mint",              { en: "Mint",               fr: "Menthe",               de: "Minze"              }],
  ["thyme",             { en: "Thyme",              fr: "Thym",                 de: "Thymian"            }],
  ["rosemary",          { en: "Rosemary",           fr: "Romarin",              de: "Rosmarin"           }],
  ["coriander",         { en: "Coriander",          fr: "Coriandre",            de: "Koriander"          }],
  // ── Specific salad variants (longer keys = tried before "lettuce"/"iceberg") ─
  // coreKey("romaine lettuce") = "lettuce romaine" (15 chars) > "lettuce" (7 chars)
  ["romaine lettuce",   { en: "Romaine Lettuce",    fr: "Laitue romaine",       de: "Römersalat"         }],
  ["iceberg lettuce",   { en: "Iceberg Lettuce",    fr: "Laitue iceberg",       de: "Eisbergsalat"       }],
  ["mixed greens",      { en: "Mixed Greens",       fr: "Salade verte",         de: "Blattsalat"         }],
  // ── Soups & stews ──────────────────────────────────────────────────────────
  ["soup",              { en: "Soup",               fr: "Soupe",                de: "Suppe"              }],
  ["broth",             { en: "Broth",              fr: "Bouillon",             de: "Brühe"              }],
  ["stew",              { en: "Stew",               fr: "Ragoût",               de: "Eintopf"            }],
  // ── Pickles & gherkins ─────────────────────────────────────────────────────
  // coreKey("cucumber pickles") = "cucumber pickles" (16 chars) > "cucumber" (8) and "pickles" (7)
  // This ensures "PICKLES, CUCUMBER, DILL" → "Cornichons" not "Concombre"
  ["cucumber pickles",  { en: "Pickles",            fr: "Cornichons",           de: "Essiggurken"        }],
  ["pickles",           { en: "Pickles",            fr: "Cornichons",           de: "Essiggurken"        }],
  ["pickle",            { en: "Pickle",             fr: "Cornichon",            de: "Essiggurke"         }],
  ["gherkin",           { en: "Gherkin",            fr: "Cornichon",            de: "Essiggurke"         }],
  // ── Additional vegetables (multi-word and missing) ─────────────────────────
  ["red cabbage",       { en: "Red Cabbage",        fr: "Chou rouge",           de: "Rotkohl"            }],
  ["brussels sprouts",  { en: "Brussels Sprouts",   fr: "Choux de Bruxelles",   de: "Rosenkohl"          }],
  ["swiss chard",       { en: "Swiss Chard",        fr: "Blette",               de: "Mangold"            }],
  ["parsnip",           { en: "Parsnip",            fr: "Panais",               de: "Pastinake"          }],
  ["celeriac",          { en: "Celeriac",           fr: "Céleri-rave",          de: "Knollensellerie"    }],
  ["squash",            { en: "Squash",             fr: "Courge",               de: "Kürbis"             }],
  // ── Singular / standalone forms (critical for subset matching) ─────────────
  // These enable findBestBaseMatch to work for USDA descriptions like
  // "LENTILS, MATURE SEEDS, COOKED" → coreK "lentils seeds" → matches "lentils"
  ["lentil",            { en: "Lentil",             fr: "Lentilles",            de: "Linsen"             }],
  ["peas",              { en: "Peas",               fr: "Petits pois",          de: "Erbsen"             }],
  ["pea",               { en: "Pea",                fr: "Petit pois",           de: "Erbse"              }],
  ["chickpea",          { en: "Chickpea",           fr: "Pois chiches",         de: "Kichererbsen"       }],
  ["soybean",           { en: "Soybean",            fr: "Soja",                 de: "Sojabohne"          }],
  ["mushroom",          { en: "Mushroom",           fr: "Champignon",           de: "Champignon"         }],
  ["onion",             { en: "Onion",              fr: "Oignon",               de: "Zwiebel"            }],
  ["carrot",            { en: "Carrot",             fr: "Carotte",              de: "Karotte"            }],
  ["tomato",            { en: "Tomato",             fr: "Tomate",               de: "Tomate"             }],
  ["potato",            { en: "Potato",             fr: "Pomme de terre",       de: "Kartoffel"          }],
  ["grape",             { en: "Grape",              fr: "Raisin",               de: "Weintraube"         }],
  ["egg",               { en: "Egg",                fr: "Œuf",                  de: "Ei"                 }],
  ["bean",              { en: "Bean",               fr: "Haricot",              de: "Bohne"              }],
];

// Precompute lookup: sorted-core-words → localized names (computed at module load)
function _coreKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !DEDUP_STATE_WORDS.has(w) && !DEDUP_NOISE_WORDS.has(w))
    .sort()
    .join(" ");
}
const FOOD_BASE_NAMES: Record<string, LocaleMap> = Object.fromEntries(
  _FOOD_NAME_DATA.map(([name, labels]) => [_coreKey(name), labels])
);

// Sorted longest-first for subset matching — longer keys (more specific) win.
// e.g. "green peas" beats "peas" when both words are in the description.
const FOOD_BASE_ENTRIES = Object.entries(FOOD_BASE_NAMES)
  .sort((a, b) => b[0].length - a[0].length);

/**
 * Find the longest FOOD_BASE_NAMES key whose every word is present in coreK.
 * Example: coreK "lentils salt seeds" → "lentils" ⊆ coreWords → returns Lentilles/Linsen
 * Example: coreK "souffle spinach"    → "spinach" ⊆ coreWords → returns Épinards/Spinat
 */
function findBestBaseMatch(coreK: string): LocaleMap | null {
  const coreWords = new Set(coreK.split(" "));
  for (const [key, labels] of FOOD_BASE_ENTRIES) {
    const kws = key.split(" ");
    if (kws.length > 0 && kws.every(w => coreWords.has(w))) return labels;
  }
  return null;
}

// ─── Word-level translation for compound dish names ───────────────────────────
// Built from single-word entries in _FOOD_NAME_DATA.
// Used as last-resort fallback in localizeFood() for truly unknown compounds.
const WORD_TRANSLATIONS: Record<string, LocaleMap> = {};
for (const [name, labels] of _FOOD_NAME_DATA) {
  const ws = name.toLowerCase().split(/\s+/);
  if (ws.length === 1) WORD_TRANSLATIONS[ws[0]] = labels;
}
// Extra common words in USDA descriptions not covered by _FOOD_NAME_DATA
const _EXTRA_WORDS: [string, LocaleMap][] = [
  ["soup",      { en: "Soup",     fr: "Soupe",          de: "Suppe"           }],
  ["salad",     { en: "Salad",    fr: "Salade",          de: "Salat"          }],
  ["juice",     { en: "Juice",    fr: "Jus",             de: "Saft"           }],
  ["puree",     { en: "Puree",    fr: "Purée",           de: "Püree"          }],
  ["sprouts",   { en: "Sprouts",  fr: "Germes",          de: "Sprossen"       }],
  ["sprout",    { en: "Sprout",   fr: "Germe",           de: "Spross"         }],
  ["endive",    { en: "Endive",   fr: "Endive",          de: "Chicorée"       }],
  ["chard",     { en: "Chard",    fr: "Blette",          de: "Mangold"        }],
];
for (const [word, labels] of _EXTRA_WORDS) {
  if (!WORD_TRANSLATIONS[word]) WORD_TRANSLATIONS[word] = labels;
}
// Sorted longest-first (prevents partial matches), with precomputed regex
const _WORD_ENTRIES: [string, LocaleMap][] =
  Object.entries(WORD_TRANSLATIONS).sort((a, b) => b[0].length - a[0].length);
const _WORD_REGEXES: Record<string, RegExp> = Object.fromEntries(
  _WORD_ENTRIES.map(([eng]) => [eng, new RegExp(`\\b${eng}\\b`, "gi")])
);

// Precomputed state-word regexes for the word-level fallback path
const _STATE_ENTRIES = Object.entries(STATE_LABELS) as [string, LocaleMap][];
const _STATE_REGEXES: Record<string, RegExp> = Object.fromEntries(
  _STATE_ENTRIES.map(([w]) => [w, new RegExp(`\\b${w}\\b`, "gi")])
);

/**
 * Return a localized display name for a USDA food.
 *
 * Strategy (in order):
 * 0. Category override (forceBaseName): if the USDA main segment starts with the
 *    category pivot word, force the category label as base (Mode B only).
 *    "SOUP, TOMATO, CANNED" → forceBaseName={en:"Soup"} → "Soupe, en conserve"
 * 1. Exact coreKey match in FOOD_BASE_NAMES           → "SPINACH, RAW" → "Épinards"
 * 2. Subset match via findBestBaseMatch               → "SPINACH, COOKED, BOILED, WITHOUT SALT"
 *    (coreK "salt spinach" → "spinach" ⊆ coreWords)    coreK "salt spinach" → "Épinards, cuits"
 * 3. Word-level replacement on formatted USDA title   → "Spinach Souffle" → "Épinards Souffle"
 *    (also replaces state words: cooked→cuits, etc.)
 */
function localizeFood(
  description: string,
  key: string,
  locale: FoodLocale,
  forceBaseName?: LocaleMap,
): string {
  // 0. Category override: if the main segment of the USDA description starts with
  //    the category pivot's English label, use the localized category label as base.
  //    This makes "SOUP, TOMATO, CANNED" → "Soupe, en conserve" (not "Tomates").
  if (forceBaseName) {
    const mainSeg = description.toLowerCase().split(",")[0].trim();
    const enLabel = forceBaseName.en.toLowerCase();
    if (mainSeg === enLabel || mainSeg.startsWith(enLabel + " ")) {
      const pipeIdx = key.indexOf("|");
      const stateK  = pipeIdx >= 0 ? key.slice(pipeIdx + 1) : "";
      const base    = forceBaseName[locale];
      if (!stateK) return base;
      const stateLabel = [...new Set(
        stateK.split(" ").map(w => STATE_LABELS[w]?.[locale]).filter(Boolean)
      )].join(", ");
      return stateLabel ? `${base}, ${stateLabel}` : base;
    }
  }
  const pipeIdx = key.indexOf("|");
  const coreK   = pipeIdx >= 0 ? key.slice(0, pipeIdx) : key;
  const stateK  = pipeIdx >= 0 ? key.slice(pipeIdx + 1) : "";

  // 1 & 2: exact match first, then subset match
  const baseNames = FOOD_BASE_NAMES[coreK] ?? findBestBaseMatch(coreK);
  if (baseNames) {
    const base = baseNames[locale];
    if (!stateK) return base;
    // Deduplicate state labels (boiled+cooked → "gekocht" in DE, not "gekocht, gekocht")
    const stateLabel = [...new Set(
      stateK.split(" ").map(w => STATE_LABELS[w]?.[locale]).filter(Boolean)
    )].join(", ");
    return stateLabel ? `${base}, ${stateLabel}` : base;
  }

  // 3: word-level replacement for truly unknown compounds (e.g. branded products)
  const formatted = formatName(description);
  if (locale === "en") return formatted;
  let result = formatted;
  // Translate known food ingredient words
  for (const [eng, map] of _WORD_ENTRIES) {
    result = result.replace(_WORD_REGEXES[eng], map[locale]);
  }
  // Also translate cooking state words (cooked→cuits, boiled→bouillis, etc.)
  for (const [state, map] of _STATE_ENTRIES) {
    result = result.replace(_STATE_REGEXES[state], map[locale]);
  }
  return result;
}

// ─── Name formatting ──────────────────────────────────────────────────────────
// SR Legacy / Foundation foods come with ALL-CAPS names → convert to title case.
function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatName(raw: string): string {
  if (!raw) return "Unknown";
  return raw === raw.toUpperCase() && raw.length > 2 ? toTitleCase(raw) : raw;
}

type RawFoodNutrient = { nutrientId: number; value: number };
type RawFood = Record<string, unknown>;

function parseNutrients(foodNutrients: RawFoodNutrient[]): NutrientsPer100g {
  const byId = new Map<number, number>();
  for (const n of foodNutrients) {
    if (typeof n.nutrientId === "number" && typeof n.value === "number" && !isNaN(n.value)) {
      byId.set(n.nutrientId, n.value);
    }
  }

  const result = {} as NutrientsPer100g;
  for (const [key, ids] of Object.entries(NUTRIENT_ID_MAP)) {
    let val: number | null = null;
    for (const id of ids) {
      const v = byId.get(id);
      if (v !== undefined) { val = v; break; }
    }
    result[key as keyof NutrientsPer100g] = val;
  }
  return result;
}

function mapFood(
  p: RawFood,
  locale: FoodLocale = "en",
  categoryPivot?: LocaleMap,
): FoodProduct {
  const description = (p.description as string) ?? "";
  const key = dedupeKey(description);
  return {
    off_id: String(p.fdcId ?? ""),
    name: localizeFood(description, key, locale, categoryPivot),
    brand: (p.brandOwner as string | null) ?? null,
    per100g: parseNutrients(
      (p.foodNutrients as RawFoodNutrient[]) ?? []
    ),
  };
}

/** Search foods by text. Returns up to `limit` results in the requested locale. */
export async function searchFoods(
  query: string,
  limit = 12,
  locale: FoodLocale = "en"
): Promise<FoodProduct[]> {
  // Normalize FR/DE/EN query → canonical English (accent-stripped, typo-tolerant)
  const englishQuery = normalizeFoodQuery(query);
  // Locale is part of the cache key — same query returns different display names per locale
  const cacheKey = `search:${englishQuery}:${limit}:${locale}`;
  const cached = foodCache.get(cacheKey);
  if (cached) return cached;

  try {
    // Fetch more than needed to compensate for filtering + deduplication.
    // 8× gives enough headroom to show real variants (raw, cooked, soups…) after dedup.
    const fetchSize = Math.min(limit * 8, 100);
    // USDA requires one `nutrients` param per ID (repeated), not comma-separated.
    const params = new URLSearchParams({
      query: englishQuery,
      pageSize: String(fetchSize),
      dataType: "SR Legacy,Foundation,Branded",
      api_key: getApiKey(),
    });
    for (const id of ALL_NUTRIENT_IDS) params.append("nutrients", String(id));

    const res = await fetch(`${USDA_BASE}/foods/search?${params}`);
    if (!res.ok) return [];
    const data = await res.json();

    const rawFoods = (data.foods ?? []) as RawFood[];

    // ── Pivot term ───────────────────────────────────────────────────────────
    // The pivot is the last NON-STATE word of the English query (the food noun).
    // Trailing cooking states are skipped so "lentils cooked" → pivot "lentils"
    // and "green peas frozen" → pivot "peas", not "cooked"/"frozen".
    const queryWords = englishQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let pivotIdx = queryWords.length - 1;
    while (pivotIdx > 0 && _PIVOT_SKIP.has(queryWords[pivotIdx])) pivotIdx--;
    const pivot = queryWords[pivotIdx] ?? "";
    // Pre-compute the two forms once: "peas"→{"peas","pea"}, "lentil"→{"lentil","lentils"}
    const pivotForms = new Set([pivot]);
    if (pivot.endsWith("s")) pivotForms.add(pivot.slice(0, -1));
    else pivotForms.add(pivot + "s");

    // Mode B: category query (salad, soup, greens…) — expand pivot synonyms so
    // step 1b accepts all sub-types in USDA descriptions (lettuce, romaine, etc.).
    const categorySynonyms = CATEGORY_SYNONYMS[pivot];
    if (categorySynonyms) {
      for (const syn of categorySynonyms) {
        pivotForms.add(syn);
        if (syn.endsWith("s")) pivotForms.add(syn.slice(0, -1));
        else pivotForms.add(syn + "s");
      }
    }

    // Mode B: resolve the pivot category's own localized label.
    // Used in two places:
    //   (a) mapFood — forceBaseName: items whose USDA main segment starts with the
    //       pivot word get the category label, not the ingredient label.
    //       "SOUP, TOMATO, CANNED" → "Soupe, en conserve" (not "Tomates").
    //   (b) categoryLabels — step 5b: accepted display-name prefixes.
    const categoryPivotNames: LocaleMap | undefined = categorySynonyms
      ? (FOOD_BASE_NAMES[pivot] ?? findBestBaseMatch(pivot)) ?? undefined
      : undefined;

    // Mode B: collect localized labels for ALL synonyms — step 5b accepted set.
    // If categoryLabels is empty (no synonyms resolved), skip step 5b entirely
    // so we don't filter out everything.
    let categoryLabels: Set<string> | null = null;
    if (categorySynonyms) {
      categoryLabels = new Set<string>();
      for (const syn of categorySynonyms) {
        const names = FOOD_BASE_NAMES[syn] ?? findBestBaseMatch(syn);
        if (names) categoryLabels.add(names[locale].toLowerCase());
      }
      // Also add the pivot's own label (already in synonyms list but make it explicit)
      if (categoryPivotNames) categoryLabels.add(categoryPivotNames[locale].toLowerCase());
      // Safety: if nothing resolved, skip this filter (don't return 0 results)
      if (categoryLabels.size === 0) categoryLabels = null;
    }

    // Mode A: localized label for step 5b (display name must include it).
    // "lentils" → {fr:"Lentilles"} → pivotLabel "lentilles"
    // Unknown pivots → "" → step 5b skipped.
    const _pivotNames = categorySynonyms ? null : (FOOD_BASE_NAMES[pivot] ?? findBestBaseMatch(pivot));
    const pivotLabel = _pivotNames ? _pivotNames[locale].toLowerCase() : "";

    // ── Step 1: Combined filter ───────────────────────────────────────────────
    const filtered = rawFoods.filter((p) => {
      if (!p.description) return false;
      const desc = (p.description as string);
      const lower = desc.toLowerCase();

      // 1a. Vegetarian relevance (existing logic)
      if (!isVegetarianRelevant(desc)) return false;

      // 1b. Pivot relevance — the MAIN INGREDIENT (first comma segment) must contain
      //     the pivot term or its variant.
      //     Only the first comma segment is checked so "OIL, FOR SALADS" or "CHEESE,
      //     PARMESAN, FOR SALADS" don't pass (mainSegment = "oil" / "cheese" → no match).
      if (pivot) {
        const mainSegment = lower.split(",")[0].trim();
        if (![...pivotForms].some(v => mainSegment.includes(v))) return false;

        // 1b-ii. For category Mode B: reject compound-noun items (SALAD DRESSING, etc.)
        //        Uses CATEGORY_EXCLUSIONS + cleanFoodResults isDisqualified.
        if (categorySynonyms) {
          const exclusions = CATEGORY_EXCLUSIONS[pivot];
          if (exclusions) {
            const mainWords = mainSegment.split(/\s+/);
            if (mainWords.some(w => (exclusions as readonly string[]).includes(w))) return false;
          }
        }

        // 1b-iii. Universal disqualification: dressing, sauce, powder, mix, etc.
        if (isDisqualified(desc)) return false;
      }

      // 1c. Nutritional validation via validateNutrition (calories 0–800, protein 0–100).
      //     Also enforces per-category calorie ceiling (CATEGORY_MAX_CALORIES).
      const nutrients = (p.foodNutrients as RawFoodNutrient[]) ?? [];
      // Use all mapped IDs for each key (covers 1008 / 2047 / 2048 for calories, etc.)
      const calEntry = nutrients.find(n => NUTRIENT_ID_MAP.calories.includes(n.nutrientId));
      const protEntry = nutrients.find(n => NUTRIENT_ID_MAP.protein.includes(n.nutrientId));
      // Reject explicit 0 kcal (corrupt USDA entry)
      if (calEntry !== undefined && calEntry.value === 0) return false;
      // Category calorie ceiling
      if (categorySynonyms && calEntry !== undefined) {
        const maxCal = CATEGORY_MAX_CALORIES[pivot];
        if (maxCal !== undefined && calEntry.value > maxCal) return false;
      }
      // Nutritional validation: rejects calories > 800 (except oils/nuts) and impossible protein
      const catalogEntry = getCatalogEntry(pivot);
      if (!validateNutrition(
        {
          calories: calEntry?.value ?? null,
          protein: protEntry?.value ?? null,
          fat: null, carbs: null, fiber: null, sugar: null, sodium: null,
          calcium: null, iron: null, zinc: null, b12: null, omega3: null, vitaminD: null, vitaminC: null,
        },
        catalogEntry?.category
      )) return false;

      return true;
    });

    // ── Step 2: Rank — SR Legacy / Foundation first (curated data), then Branded ─
    const ranked = [
      ...filtered.filter((p) => p.dataType === "SR Legacy" || p.dataType === "Foundation"),
      ...filtered.filter((p) => p.dataType !== "SR Legacy" && p.dataType !== "Foundation"),
    ];

    // ── Step 3: Raw dedup — same USDA core+state key → keep first (highest-ranked) ─
    const seenKeys = new Set<string>();
    const rawDeduped = ranked.filter((p) => {
      const k = dedupeKey((p.description as string) ?? "");
      if (!k || seenKeys.has(k)) return false;
      seenKeys.add(k);
      return true;
    });

    // ── Step 4: Map to FoodProduct (localization happens here) ────────────────
    // categoryPivotNames (Mode B only): forces the category label when the USDA
    // main segment starts with the pivot word ("SOUP, *" → "Soupe").
    const mapped = rawDeduped.map((p) => mapFood(p, locale, categoryPivotNames));

    // ── Step 5: Display-name dedup — same localized label → keep first ────────
    // Needed because findBestBaseMatch collapses multiple USDA keys to the same name,
    // e.g. "lentils seeds" and "lentils salt seeds" both → "Lentilles".
    const seenNames = new Set<string>();
    const nameDeduped = mapped.filter((p) => {
      if (seenNames.has(p.name)) return false;
      seenNames.add(p.name);
      return true;
    });

    // ── Step 5b: Post-localization pivot filter ───────────────────────────────
    // Mode A (precise ingredient): display name must CONTAIN the localized pivot.
    //   "LENTIL AND QUINOA BLEND" → localizes to "Quinoa" → doesn't contain "lentilles" → excluded.
    // Mode B (category): display name must START WITH one of the localized category labels.
    //   "Pomme de terre" (from "POTATO SALAD") → startsWith("salade"|"laitue"|…)? No → excluded.
    //   "Laitue romaine" → startsWith("laitue")? Yes → kept.
    // If neither applies (pivot unknown), the step is skipped.
    const pivotFiltered = categoryLabels
      ? nameDeduped.filter((p) => {
          const n = p.name.toLowerCase();
          return [...categoryLabels!].some((label) => n.includes(label));
        })
      : pivotLabel
      ? nameDeduped.filter((p) => p.name.toLowerCase().includes(pivotLabel))
      : nameDeduped;

    // ── Step 5c: Rank — raw > cooked > preserved > prepared ──────────────────
    const ranked2 = rankResults(pivotFiltered);

    // ── Step 6: Variant cap — max 4 occurrences per base display name ─────────
    // Base name = text before the first ", " (the state suffix).
    // Allows: "Lentilles" + "Lentilles, cuits" + "Lentilles, en conserve" + 1 more.
    // Prevents flooding the list with 8 near-identical lentil variants.
    const variantCount = new Map<string, number>();
    const MAX_VARIANTS = 4;
    const capped = ranked2.filter((p) => {
      const commaIdx = p.name.indexOf(", ");
      const base = commaIdx >= 0 ? p.name.slice(0, commaIdx) : p.name;
      const count = variantCount.get(base) ?? 0;
      if (count >= MAX_VARIANTS) return false;
      variantCount.set(base, count + 1);
      return true;
    });

    const products = capped.slice(0, limit);
    foodCache.set(cacheKey, products);
    return products;
  } catch {
    return [];
  }
}

