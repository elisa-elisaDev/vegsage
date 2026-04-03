/**
 * VegSage Food Catalog — Layer 3 of the search architecture.
 *
 * Defines a canonical food entry per food item with:
 * - canonical: unique English identifier (used for USDA queries + cache keys)
 * - category: food group (for calorie limits, filtering, ranking)
 * - synonyms per locale: for display and alias matching
 *
 * This catalog is the single source of truth for food identity in VegSage.
 * USDA provides nutrient values; this catalog provides identity and labels.
 */

export type FoodCategory =
  | "legume"
  | "vegetable"
  | "leafy"
  | "fruit"
  | "grain"
  | "dairy_eggs"
  | "plant_protein"
  | "nut_seed"
  | "oil"
  | "herb"
  | "condiment"
  | "beverage"
  | "soup"
  | "snack"
  | "spread"
  | "prepared_meal";

export type FoodEntry = {
  canonical: string;
  category: FoodCategory;
  /** Max kcal/100g allowed — enforced during result validation */
  maxCalPer100g?: number;
  synonyms: {
    en: string[];
    fr: string[];
    de: string[];
  };
};

export const FOOD_CATALOG: FoodEntry[] = [
  // ── Legumes ──────────────────────────────────────────────────────────────────
  {
    canonical: "lentils",
    category: "legume",
    synonyms: {
      en: ["lentils", "lentil"],
      fr: ["lentilles", "lentille"],
      de: ["linsen", "linse"],
    },
  },
  {
    canonical: "chickpeas",
    category: "legume",
    synonyms: {
      en: ["chickpeas", "chickpea", "garbanzo"],
      fr: ["pois chiches", "pois chiche"],
      de: ["kichererbsen", "kichererbse"],
    },
  },
  {
    canonical: "green peas",
    category: "legume",
    synonyms: {
      en: ["green peas", "peas", "pea"],
      fr: ["petits pois", "pois"],
      de: ["erbsen", "erbse"],
    },
  },
  {
    canonical: "green beans",
    category: "legume",
    synonyms: {
      en: ["green beans", "string beans"],
      fr: ["haricots verts"],
      de: ["grüne bohnen", "bohnen"],
    },
  },
  {
    canonical: "red kidney beans",
    category: "legume",
    synonyms: {
      en: ["red kidney beans", "kidney beans"],
      fr: ["haricots rouges"],
      de: ["rote bohnen", "kidneybohnen"],
    },
  },
  {
    canonical: "white beans",
    category: "legume",
    synonyms: {
      en: ["white beans", "navy beans", "cannellini"],
      fr: ["haricots blancs"],
      de: ["weiße bohnen", "weisse bohnen"],
    },
  },
  {
    canonical: "black beans",
    category: "legume",
    synonyms: {
      en: ["black beans"],
      fr: ["haricots noirs"],
      de: ["schwarze bohnen"],
    },
  },
  {
    canonical: "soybeans",
    category: "legume",
    synonyms: {
      en: ["soybeans", "edamame"],
      fr: ["soja", "edamame"],
      de: ["sojabohnen", "edamame"],
    },
  },
  // ── Vegetables ───────────────────────────────────────────────────────────────
  {
    canonical: "lettuce",
    category: "leafy",
    maxCalPer100g: 80,
    synonyms: {
      en: ["lettuce", "romaine", "iceberg lettuce", "butter lettuce"],
      fr: ["laitue", "salade", "salade verte"],
      de: ["salat", "kopfsalat", "grüner salat"],
    },
  },
  {
    canonical: "spinach",
    category: "leafy",
    maxCalPer100g: 80,
    synonyms: {
      en: ["spinach"],
      fr: ["épinards", "epinards"],
      de: ["spinat"],
    },
  },
  {
    canonical: "broccoli",
    category: "vegetable",
    synonyms: {
      en: ["broccoli"],
      fr: ["brocoli"],
      de: ["brokkoli"],
    },
  },
  {
    canonical: "cauliflower",
    category: "vegetable",
    synonyms: {
      en: ["cauliflower"],
      fr: ["chou-fleur"],
      de: ["blumenkohl"],
    },
  },
  {
    canonical: "carrots",
    category: "vegetable",
    synonyms: {
      en: ["carrots", "carrot"],
      fr: ["carottes", "carotte"],
      de: ["karotten", "karotte", "möhren"],
    },
  },
  {
    canonical: "tomatoes",
    category: "vegetable",
    synonyms: {
      en: ["tomatoes", "tomato"],
      fr: ["tomates", "tomate"],
      de: ["tomaten", "tomate"],
    },
  },
  {
    canonical: "potatoes",
    category: "vegetable",
    synonyms: {
      en: ["potatoes", "potato"],
      fr: ["pommes de terre", "pomme de terre"],
      de: ["kartoffeln", "kartoffel"],
    },
  },
  {
    canonical: "sweet potato",
    category: "vegetable",
    synonyms: {
      en: ["sweet potato", "yam"],
      fr: ["patate douce", "patates douces"],
      de: ["süßkartoffel", "sussekartoffel"],
    },
  },
  {
    canonical: "zucchini",
    category: "vegetable",
    synonyms: {
      en: ["zucchini", "courgette"],
      fr: ["courgettes", "courgette"],
      de: ["zucchini"],
    },
  },
  {
    canonical: "eggplant",
    category: "vegetable",
    synonyms: {
      en: ["eggplant", "aubergine"],
      fr: ["aubergine"],
      de: ["aubergine"],
    },
  },
  {
    canonical: "bell pepper",
    category: "vegetable",
    synonyms: {
      en: ["bell pepper", "bell peppers"],
      fr: ["poivron", "poivrons"],
      de: ["paprika"],
    },
  },
  {
    canonical: "mushrooms",
    category: "vegetable",
    synonyms: {
      en: ["mushrooms", "mushroom"],
      fr: ["champignons", "champignon"],
      de: ["champignons", "pilze"],
    },
  },
  {
    canonical: "onions",
    category: "vegetable",
    synonyms: {
      en: ["onions", "onion"],
      fr: ["oignons", "oignon"],
      de: ["zwiebeln", "zwiebel"],
    },
  },
  {
    canonical: "avocado",
    category: "vegetable",
    synonyms: {
      en: ["avocado"],
      fr: ["avocat"],
      de: ["avocado"],
    },
  },
  {
    canonical: "cucumber",
    category: "vegetable",
    synonyms: {
      en: ["cucumber"],
      fr: ["concombre"],
      de: ["gurke"],
    },
  },
  {
    canonical: "fennel",
    category: "vegetable",
    synonyms: {
      en: ["fennel"],
      fr: ["fenouil"],
      de: ["fenchel"],
    },
  },
  {
    canonical: "celery",
    category: "vegetable",
    synonyms: {
      en: ["celery"],
      fr: ["céleri", "celeri"],
      de: ["sellerie"],
    },
  },
  {
    canonical: "asparagus",
    category: "vegetable",
    synonyms: {
      en: ["asparagus"],
      fr: ["asperges", "asperge"],
      de: ["spargel"],
    },
  },
  {
    canonical: "kale",
    category: "leafy",
    maxCalPer100g: 80,
    synonyms: {
      en: ["kale"],
      fr: ["chou kale", "kale"],
      de: ["grünkohl", "grunkohl"],
    },
  },
  {
    canonical: "beet",
    category: "vegetable",
    synonyms: {
      en: ["beet", "beets", "beetroot"],
      fr: ["betterave"],
      de: ["rote bete", "rote beete"],
    },
  },
  {
    canonical: "corn",
    category: "vegetable",
    synonyms: {
      en: ["corn", "maize"],
      fr: ["maïs", "mais"],
      de: ["mais"],
    },
  },
  {
    canonical: "pickles",
    category: "condiment",
    synonyms: {
      en: ["pickles", "pickle", "gherkin"],
      fr: ["cornichons", "cornichon"],
      de: ["essiggurken", "essiggurke"],
    },
  },
  // ── Fruits ───────────────────────────────────────────────────────────────────
  {
    canonical: "apple",
    category: "fruit",
    synonyms: { en: ["apple", "apples"], fr: ["pomme", "pommes"], de: ["apfel"] },
  },
  {
    canonical: "banana",
    category: "fruit",
    synonyms: { en: ["banana"], fr: ["banane"], de: ["banane"] },
  },
  {
    canonical: "strawberry",
    category: "fruit",
    synonyms: { en: ["strawberry", "strawberries"], fr: ["fraise", "fraises"], de: ["erdbeere"] },
  },
  {
    canonical: "blueberry",
    category: "fruit",
    synonyms: { en: ["blueberry", "blueberries"], fr: ["myrtille", "myrtilles"], de: ["heidelbeere"] },
  },
  {
    canonical: "mango",
    category: "fruit",
    synonyms: { en: ["mango"], fr: ["mangue"], de: ["mango"] },
  },
  // ── Plant proteins ────────────────────────────────────────────────────────────
  {
    canonical: "tofu",
    category: "plant_protein",
    synonyms: { en: ["tofu"], fr: ["tofu"], de: ["tofu"] },
  },
  {
    canonical: "tempeh",
    category: "plant_protein",
    synonyms: { en: ["tempeh"], fr: ["tempeh"], de: ["tempeh"] },
  },
  {
    canonical: "seitan",
    category: "plant_protein",
    synonyms: { en: ["seitan"], fr: ["seitan"], de: ["seitan"] },
  },
  // ── Grains ────────────────────────────────────────────────────────────────────
  {
    canonical: "rice",
    category: "grain",
    synonyms: { en: ["rice"], fr: ["riz"], de: ["reis"] },
  },
  {
    canonical: "pasta",
    category: "grain",
    synonyms: { en: ["pasta", "noodles"], fr: ["pâtes", "pates"], de: ["nudeln", "pasta"] },
  },
  {
    canonical: "oats",
    category: "grain",
    synonyms: { en: ["oats", "oatmeal"], fr: ["avoine", "flocons d'avoine"], de: ["hafer", "haferflocken"] },
  },
  {
    canonical: "quinoa",
    category: "grain",
    synonyms: { en: ["quinoa"], fr: ["quinoa"], de: ["quinoa"] },
  },
  {
    canonical: "bread",
    category: "grain",
    synonyms: { en: ["bread"], fr: ["pain"], de: ["brot"] },
  },
  // ── Dairy & eggs ──────────────────────────────────────────────────────────────
  {
    canonical: "eggs",
    category: "dairy_eggs",
    synonyms: {
      en: ["eggs", "egg"],
      fr: ["œufs", "oeufs", "oeuf"],
      de: ["eier", "ei"],
    },
  },
  {
    canonical: "yogurt",
    category: "dairy_eggs",
    synonyms: {
      en: ["yogurt", "yoghurt"],
      fr: ["yaourt", "yoghourt", "yougourt"],
      de: ["joghurt", "jogurt"],
    },
  },
  {
    canonical: "milk",
    category: "dairy_eggs",
    synonyms: { en: ["milk"], fr: ["lait"], de: ["milch"] },
  },
  {
    canonical: "cheese",
    category: "dairy_eggs",
    synonyms: { en: ["cheese"], fr: ["fromage"], de: ["käse", "kase"] },
  },
  // ── Nuts & seeds ──────────────────────────────────────────────────────────────
  {
    canonical: "walnuts",
    category: "nut_seed",
    synonyms: { en: ["walnuts", "walnut"], fr: ["noix"], de: ["walnüsse", "walnusse"] },
  },
  {
    canonical: "almonds",
    category: "nut_seed",
    synonyms: { en: ["almonds", "almond"], fr: ["amandes", "amande"], de: ["mandeln"] },
  },
  {
    canonical: "chia seeds",
    category: "nut_seed",
    synonyms: {
      en: ["chia seeds", "chia"],
      fr: ["graines de chia"],
      de: ["chiasamen"],
    },
  },
  {
    canonical: "pumpkin seeds",
    category: "nut_seed",
    synonyms: {
      en: ["pumpkin seeds"],
      fr: ["graines de courge"],
      de: ["kürbiskerne"],
    },
  },
  // ── Condiments ────────────────────────────────────────────────────────────────
  {
    canonical: "olive oil",
    category: "oil",
    synonyms: { en: ["olive oil"], fr: ["huile d'olive"], de: ["olivenöl"] },
  },
  {
    canonical: "nutritional yeast",
    category: "condiment",
    synonyms: {
      en: ["nutritional yeast"],
      fr: ["levure nutritionnelle"],
      de: ["hefeflocken", "nährhefe"],
    },
  },
  // ── Herbs ────────────────────────────────────────────────────────────────────
  {
    canonical: "fennel",
    category: "herb",
    synonyms: { en: ["fennel"], fr: ["fenouil"], de: ["fenchel"] },
  },
  // ── Beverages ─────────────────────────────────────────────────────────────────
  {
    canonical: "orange juice",
    category: "beverage",
    synonyms: {
      en: ["orange juice"],
      fr: ["jus d'orange"],
      de: ["orangensaft"],
    },
  },
  {
    canonical: "apple juice",
    category: "beverage",
    synonyms: {
      en: ["apple juice"],
      fr: ["jus de pomme"],
      de: ["apfelsaft"],
    },
  },
  {
    canonical: "coffee",
    category: "beverage",
    synonyms: {
      en: ["coffee"],
      fr: ["café", "cafe"],
      de: ["kaffee"],
    },
  },
  {
    canonical: "tea",
    category: "beverage",
    synonyms: {
      en: ["tea"],
      fr: ["thé", "the"],
      de: ["tee"],
    },
  },
  {
    canonical: "green tea",
    category: "beverage",
    synonyms: {
      en: ["green tea"],
      fr: ["thé vert", "the vert"],
      de: ["grüner tee", "gruner tee"],
    },
  },
  {
    canonical: "hot chocolate",
    category: "beverage",
    synonyms: {
      en: ["hot chocolate", "cocoa"],
      fr: ["chocolat chaud"],
      de: ["heißer kakao", "heisser kakao", "kakao"],
    },
  },
  {
    canonical: "ovomaltine",
    category: "beverage",
    synonyms: {
      en: ["ovomaltine", "ovaltine"],
      fr: ["ovomaltine"],
      de: ["ovomaltine"],
    },
  },
  {
    canonical: "almond milk",
    category: "beverage",
    synonyms: {
      en: ["almond milk"],
      fr: ["lait d'amande"],
      de: ["mandelmilch"],
    },
  },
  {
    canonical: "oat milk",
    category: "beverage",
    synonyms: {
      en: ["oat milk"],
      fr: ["lait d'avoine"],
      de: ["hafermilch"],
    },
  },
  {
    canonical: "soy milk",
    category: "beverage",
    synonyms: {
      en: ["soy milk", "soya milk"],
      fr: ["lait de soja"],
      de: ["sojamilch"],
    },
  },
  {
    canonical: "protein drink",
    category: "beverage",
    synonyms: {
      en: ["protein drink", "protein shake"],
      fr: ["boisson protéinée", "boisson proteïnee", "shake protéiné"],
      de: ["proteindrink", "eiweißgetränk", "proteinshake"],
    },
  },
  // ── Spreads ───────────────────────────────────────────────────────────────────
  {
    canonical: "strawberry jam",
    category: "spread",
    synonyms: {
      en: ["strawberry jam", "strawberry jelly"],
      fr: ["confiture de fraises"],
      de: ["erdbeermarmelade", "erdbeerkonfitüre"],
    },
  },
  {
    canonical: "apricot jam",
    category: "spread",
    synonyms: {
      en: ["apricot jam", "apricot jelly"],
      fr: ["confiture d'abricots"],
      de: ["aprikosenmarmelade", "aprikosenkonfitüre"],
    },
  },
  {
    canonical: "raspberry jam",
    category: "spread",
    synonyms: {
      en: ["raspberry jam", "raspberry jelly"],
      fr: ["confiture de framboises"],
      de: ["himbeermarmelade", "himbeerkonfitüre"],
    },
  },
  {
    canonical: "honey",
    category: "spread",
    synonyms: {
      en: ["honey"],
      fr: ["miel"],
      de: ["honig"],
    },
  },
  {
    canonical: "maple syrup",
    category: "spread",
    synonyms: {
      en: ["maple syrup"],
      fr: ["sirop d'érable", "sirop d'erable"],
      de: ["ahornsirup"],
    },
  },
  {
    canonical: "peanut butter",
    category: "spread",
    synonyms: {
      en: ["peanut butter"],
      fr: ["beurre de cacahuètes", "beurre d'arachides"],
      de: ["erdnussbutter"],
    },
  },
  {
    canonical: "hazelnut spread",
    category: "spread",
    synonyms: {
      en: ["hazelnut spread", "nutella"],
      fr: ["pâte à tartiner aux noisettes", "pate a tartiner noisettes", "nutella"],
      de: ["haselnusscreme", "nussnougatcreme", "nutella"],
    },
  },
  // ── Snacks ────────────────────────────────────────────────────────────────────
  {
    canonical: "protein bar",
    category: "snack",
    synonyms: {
      en: ["protein bar"],
      fr: ["barre protéinée", "barre proteinee"],
      de: ["proteinriegel"],
    },
  },
  {
    canonical: "cereal bar",
    category: "snack",
    synonyms: {
      en: ["cereal bar", "granola bar"],
      fr: ["barre de céréales", "barre de cereales"],
      de: ["müsliriegel", "musli riegel", "getreideriegel"],
    },
  },
  {
    canonical: "chocolate bar",
    category: "snack",
    synonyms: {
      en: ["chocolate bar"],
      fr: ["tablette de chocolat", "barre de chocolat"],
      de: ["schokoladenriegel", "schokolade"],
    },
  },
  {
    canonical: "dark chocolate",
    category: "snack",
    synonyms: {
      en: ["dark chocolate", "bitter chocolate"],
      fr: ["chocolat noir"],
      de: ["dunkle schokolade", "zartbitterschokolade"],
    },
  },
  {
    canonical: "cookies",
    category: "snack",
    synonyms: {
      en: ["cookies", "cookie"],
      fr: ["biscuits", "biscuit", "cookies"],
      de: ["kekse", "keks", "plätzchen"],
    },
  },
  {
    canonical: "cake",
    category: "snack",
    synonyms: {
      en: ["cake"],
      fr: ["gâteau", "gateau"],
      de: ["kuchen"],
    },
  },
  {
    canonical: "muffin",
    category: "snack",
    synonyms: {
      en: ["muffin"],
      fr: ["muffin"],
      de: ["muffin"],
    },
  },
  {
    canonical: "brownie",
    category: "snack",
    synonyms: {
      en: ["brownie"],
      fr: ["brownie"],
      de: ["brownie"],
    },
  },
  {
    canonical: "chips",
    category: "snack",
    synonyms: {
      en: ["chips", "crisps", "potato chips"],
      fr: ["chips"],
      de: ["chips", "kartoffelchips"],
    },
  },
  {
    canonical: "popcorn",
    category: "snack",
    synonyms: {
      en: ["popcorn"],
      fr: ["popcorn"],
      de: ["popcorn"],
    },
  },
  {
    canonical: "crackers",
    category: "snack",
    synonyms: {
      en: ["crackers", "cracker"],
      fr: ["crackers", "cracker", "biscuits salés"],
      de: ["cracker"],
    },
  },
  {
    canonical: "pretzels",
    category: "snack",
    synonyms: {
      en: ["pretzels", "pretzel"],
      fr: ["bretzels", "bretzel"],
      de: ["brezeln", "brezel", "laugenbrezeln"],
    },
  },
  {
    canonical: "dried fruit",
    category: "snack",
    synonyms: {
      en: ["dried fruit", "dried fruits"],
      fr: ["fruits secs"],
      de: ["trockenfrüchte", "trockenfrucht", "dörrfrüchte"],
    },
  },
  {
    canonical: "raisins",
    category: "fruit",
    synonyms: {
      en: ["raisins", "raisin"],
      fr: ["raisins secs"],
      de: ["rosinen", "rosine"],
    },
  },
  {
    canonical: "dates",
    category: "fruit",
    synonyms: {
      en: ["dates", "date"],
      fr: ["dattes", "datte"],
      de: ["datteln", "dattel"],
    },
  },
  // ── Breakfast ────────────────────────────────────────────────────────────────
  {
    canonical: "muesli",
    category: "grain",
    synonyms: {
      en: ["muesli", "müesli"],
      fr: ["müesli", "muesli"],
      de: ["müsli", "musli"],
    },
  },
  {
    canonical: "granola",
    category: "grain",
    synonyms: {
      en: ["granola"],
      fr: ["granola"],
      de: ["granola"],
    },
  },
  {
    canonical: "cornflakes",
    category: "grain",
    synonyms: {
      en: ["cornflakes", "corn flakes"],
      fr: ["corn flakes", "cornflakes"],
      de: ["cornflakes"],
    },
  },
  // ── Plant / Vegetarian ────────────────────────────────────────────────────────
  {
    canonical: "hummus",
    category: "condiment",
    synonyms: {
      en: ["hummus", "houmous"],
      fr: ["houmous", "hummus"],
      de: ["hummus"],
    },
  },
  {
    canonical: "falafel",
    category: "plant_protein",
    synonyms: {
      en: ["falafel"],
      fr: ["falafel"],
      de: ["falafel"],
    },
  },
  {
    canonical: "veggie burger",
    category: "plant_protein",
    synonyms: {
      en: ["veggie burger", "vegetable burger"],
      fr: ["burger végétarien", "burger vegetarien", "veggie burger"],
      de: ["veggie burger", "gemüseburger", "vegetarischer burger"],
    },
  },
  // ── Prepared meals ───────────────────────────────────────────────────────────
  {
    canonical: "vegetarian lasagna",
    category: "prepared_meal",
    synonyms: {
      en: ["vegetarian lasagna", "veggie lasagna"],
      fr: ["lasagnes végétariennes", "lasagnes vegetariennes"],
      de: ["vegetarische lasagne"],
    },
  },
  {
    canonical: "vegetable soup",
    category: "soup",
    synonyms: {
      en: ["vegetable soup"],
      fr: ["soupe aux légumes", "soupe de légumes", "soupe aux legumes"],
      de: ["gemüsesuppe"],
    },
  },
  {
    canonical: "tomato soup",
    category: "soup",
    synonyms: {
      en: ["tomato soup"],
      fr: ["soupe à la tomate", "soupe de tomates"],
      de: ["tomatensuppe"],
    },
  },
  {
    canonical: "lentil soup",
    category: "soup",
    synonyms: {
      en: ["lentil soup"],
      fr: ["soupe aux lentilles"],
      de: ["linsensuppe"],
    },
  },
  {
    canonical: "pumpkin soup",
    category: "soup",
    synonyms: {
      en: ["pumpkin soup"],
      fr: ["soupe au potiron", "velouté de courge"],
      de: ["kürbissuppe"],
    },
  },
  // ── Grains (extended) ─────────────────────────────────────────────────────────
  {
    canonical: "brown rice",
    category: "grain",
    synonyms: {
      en: ["brown rice"],
      fr: ["riz complet", "riz brun"],
      de: ["vollkornreis", "brauner reis"],
    },
  },
  {
    canonical: "whole wheat pasta",
    category: "grain",
    synonyms: {
      en: ["whole wheat pasta", "wholemeal pasta"],
      fr: ["pâtes complètes", "pates completes", "pâtes de blé entier"],
      de: ["vollkornnudeln", "vollkorn pasta"],
    },
  },
  {
    canonical: "whole wheat bread",
    category: "grain",
    synonyms: {
      en: ["whole wheat bread", "wholemeal bread", "whole grain bread"],
      fr: ["pain complet", "pain de blé entier"],
      de: ["vollkornbrot"],
    },
  },
  {
    canonical: "couscous",
    category: "grain",
    synonyms: {
      en: ["couscous"],
      fr: ["couscous"],
      de: ["couscous"],
    },
  },
  {
    canonical: "bulgur",
    category: "grain",
    synonyms: {
      en: ["bulgur", "bulghur"],
      fr: ["boulgour", "bulgur"],
      de: ["bulgur"],
    },
  },
  // ── Fruits (extended) ─────────────────────────────────────────────────────────
  {
    canonical: "orange",
    category: "fruit",
    synonyms: {
      en: ["orange", "oranges"],
      fr: ["orange", "oranges"],
      de: ["orange"],
    },
  },
  {
    canonical: "grapes",
    category: "fruit",
    synonyms: {
      en: ["grapes", "grape"],
      fr: ["raisin", "raisins"],
      de: ["trauben", "weintrauben"],
    },
  },
  {
    canonical: "pear",
    category: "fruit",
    synonyms: {
      en: ["pear", "pears"],
      fr: ["poire", "poires"],
      de: ["birne", "birnen"],
    },
  },
  {
    canonical: "pineapple",
    category: "fruit",
    synonyms: {
      en: ["pineapple"],
      fr: ["ananas"],
      de: ["ananas"],
    },
  },
  {
    canonical: "kiwi",
    category: "fruit",
    synonyms: {
      en: ["kiwi", "kiwifruit"],
      fr: ["kiwi"],
      de: ["kiwi"],
    },
  },
  {
    canonical: "peach",
    category: "fruit",
    synonyms: {
      en: ["peach", "peaches"],
      fr: ["pêche", "peche", "pêches"],
      de: ["pfirsich", "pfirsiche"],
    },
  },
  {
    canonical: "raspberry",
    category: "fruit",
    synonyms: {
      en: ["raspberry", "raspberries"],
      fr: ["framboise", "framboises"],
      de: ["himbeere", "himbeeren"],
    },
  },
  {
    canonical: "lemon",
    category: "fruit",
    synonyms: {
      en: ["lemon", "lemons"],
      fr: ["citron", "citrons"],
      de: ["zitrone", "zitronen"],
    },
  },
  {
    canonical: "watermelon",
    category: "fruit",
    synonyms: {
      en: ["watermelon"],
      fr: ["pastèque", "pasteque"],
      de: ["wassermelone"],
    },
  },
];

// ─── Lookup helpers ───────────────────────────────────────────────────────────

const _catalogByCanonical = new Map<string, FoodEntry>(
  FOOD_CATALOG.map((e) => [e.canonical, e])
);

export function getCatalogEntry(canonical: string): FoodEntry | null {
  return _catalogByCanonical.get(canonical) ?? null;
}

/** Find an entry by any synonym in a given locale (case-insensitive, accent-aware). */
export function findByAlias(
  query: string,
  locale: "en" | "fr" | "de"
): FoodEntry | null {
  const q = query.toLowerCase().trim();
  for (const entry of FOOD_CATALOG) {
    if (entry.synonyms[locale].some((s) => s.toLowerCase() === q)) return entry;
  }
  return null;
}
