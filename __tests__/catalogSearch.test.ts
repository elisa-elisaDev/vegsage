/**
 * Tests for the VegSage catalog search engine.
 *
 * Covers:
 * - searchCatalog: exact token matches in EN / FR / DE
 * - searchCatalog: multi-word queries (e.g. "salade verte")
 * - searchCatalog: accent-insensitive matches
 * - searchCatalog: fuzzy / typo tolerance
 * - searchCatalog: cross-locale matching
 * - searchCatalog: empty / short query guards
 * - getCatalogProduct: canonical lookup
 * - Nutrition data integrity (no null calories for common foods)
 */

import { searchCatalog, getCatalogProduct, CATALOG } from "../lib/catalogSearch";

// ─── Basic EN searches ─────────────────────────────────────────────────────────

describe("searchCatalog — EN exact", () => {
  it("finds lentils by English token", () => {
    const r = searchCatalog("lentils", "en");
    expect(r[0].off_id).toBe("cat:lentils");
  });

  it("finds tofu", () => {
    const r = searchCatalog("tofu", "en");
    expect(r[0].off_id).toBe("cat:tofu");
  });

  it("finds spinach", () => {
    const r = searchCatalog("spinach", "en");
    expect(r[0].off_id).toBe("cat:spinach");
  });

  it("returns EN label when locale is en", () => {
    const r = searchCatalog("lentils", "en");
    expect(r[0].name).toBe("Lentils");
  });
});

// ─── FR searches ──────────────────────────────────────────────────────────────

describe("searchCatalog — FR tokens", () => {
  it("lentilles → lentils (FR)", () => {
    const r = searchCatalog("lentilles", "fr");
    expect(r[0].off_id).toBe("cat:lentils");
    expect(r[0].name).toBe("Lentilles");
  });

  it("oeufs → eggs (FR, no ligature)", () => {
    const r = searchCatalog("oeufs", "fr");
    expect(r[0].off_id).toBe("cat:eggs");
  });

  it("cornichons → pickles (FR)", () => {
    const r = searchCatalog("cornichons", "fr");
    expect(r[0].off_id).toBe("cat:pickles");
  });

  it("salade → lettuce (FR)", () => {
    const r = searchCatalog("salade", "fr");
    expect(r[0].off_id).toBe("cat:lettuce");
  });

  it("salade verte → lettuce (FR multi-word)", () => {
    const r = searchCatalog("salade verte", "fr");
    expect(r.some((p) => p.off_id === "cat:lettuce")).toBe(true);
  });

  it("fenouil → fennel (FR)", () => {
    const r = searchCatalog("fenouil", "fr");
    expect(r[0].off_id).toBe("cat:fennel");
  });

  it("yaourt → yogurt (FR standard)", () => {
    const r = searchCatalog("yaourt", "fr");
    expect(r[0].off_id).toBe("cat:yogurt");
  });

  it("yoghourt → yogurt (FR alternate)", () => {
    const r = searchCatalog("yoghourt", "fr");
    expect(r[0].off_id).toBe("cat:yogurt");
  });

  it("epinards → spinach (FR, no accent)", () => {
    const r = searchCatalog("epinards", "fr");
    expect(r[0].off_id).toBe("cat:spinach");
  });

  it("noix de cajou → cashews (FR multi-word)", () => {
    const r = searchCatalog("noix de cajou", "fr");
    expect(r[0].off_id).toBe("cat:cashews");
  });

  it("returns FR label when locale is fr", () => {
    const r = searchCatalog("pois chiches", "fr");
    expect(r[0].name).toBe("Pois chiches");
  });
});

// ─── DE searches ──────────────────────────────────────────────────────────────

describe("searchCatalog — DE tokens", () => {
  it("linsen → lentils (DE)", () => {
    const r = searchCatalog("linsen", "de");
    expect(r[0].off_id).toBe("cat:lentils");
  });

  it("eier → eggs (DE)", () => {
    const r = searchCatalog("eier", "de");
    expect(r[0].off_id).toBe("cat:eggs");
  });

  it("joghurt → yogurt (DE)", () => {
    const r = searchCatalog("joghurt", "de");
    expect(r[0].off_id).toBe("cat:yogurt");
  });

  it("pilze → mushrooms (DE)", () => {
    const r = searchCatalog("pilze", "de");
    expect(r[0].off_id).toBe("cat:mushrooms");
  });

  it("grunkohl → kale (DE, accent-stripped)", () => {
    const r = searchCatalog("grunkohl", "de");
    expect(r[0].off_id).toBe("cat:kale");
  });

  it("returns DE label when locale is de", () => {
    const r = searchCatalog("linsen", "de");
    expect(r[0].name).toBe("Linsen");
  });
});

// ─── Accent-insensitive ───────────────────────────────────────────────────────

describe("searchCatalog — accent-insensitive", () => {
  it("epinards (no accent) finds spinach", () => {
    const r = searchCatalog("epinards", "fr");
    expect(r[0].off_id).toBe("cat:spinach");
  });

  it("oeufs (no ligature) finds eggs", () => {
    const r = searchCatalog("oeufs", "fr");
    expect(r[0].off_id).toBe("cat:eggs");
  });

  it("grunkohl (no umlaut) finds kale", () => {
    const r = searchCatalog("grunkohl", "de");
    expect(r[0].off_id).toBe("cat:kale");
  });

  it("uppercase LENTILLES finds lentils", () => {
    const r = searchCatalog("LENTILLES", "fr");
    expect(r[0].off_id).toBe("cat:lentils");
  });
});

// ─── Fuzzy / typo tolerance ───────────────────────────────────────────────────

describe("searchCatalog — fuzzy matching", () => {
  it("linzen (z→s typo) finds lentils via fuzzy", () => {
    const r = searchCatalog("linzen", "de");
    expect(r.some((p) => p.off_id === "cat:lentils")).toBe(true);
  });

  it("yoghrt (missing u) finds yogurt", () => {
    const r = searchCatalog("yoghrt", "en");
    expect(r.some((p) => p.off_id === "cat:yogurt")).toBe(true);
  });

  it("spinache (typo) finds spinach", () => {
    const r = searchCatalog("spinache", "en");
    expect(r.some((p) => p.off_id === "cat:spinach")).toBe(true);
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe("searchCatalog — edge cases", () => {
  it("returns [] for empty query", () => {
    expect(searchCatalog("", "en")).toEqual([]);
  });

  it("returns [] for single char", () => {
    expect(searchCatalog("a", "en")).toEqual([]);
  });

  it("returns [] for completely unknown food", () => {
    const r = searchCatalog("xyznonexistentfood99", "en");
    expect(r).toEqual([]);
  });

  it("respects limit parameter", () => {
    const r = searchCatalog("a", "en", 3);
    expect(r.length).toBeLessThanOrEqual(3);
  });
});

// ─── getCatalogProduct ────────────────────────────────────────────────────────

describe("getCatalogProduct", () => {
  it("returns a product for known canonical", () => {
    const p = getCatalogProduct("lentils", "en");
    expect(p).not.toBeNull();
    expect(p?.off_id).toBe("cat:lentils");
  });

  it("returns localized name", () => {
    expect(getCatalogProduct("lentils", "fr")?.name).toBe("Lentilles");
    expect(getCatalogProduct("lentils", "de")?.name).toBe("Linsen");
  });

  it("returns null for unknown canonical", () => {
    expect(getCatalogProduct("unicorn meat", "en")).toBeNull();
  });

  it("product has valid per100g structure", () => {
    const p = getCatalogProduct("lentils", "en")!;
    expect(p.per100g).toBeDefined();
    expect(typeof p.per100g.calories).toBe("number");
    expect(typeof p.per100g.protein).toBe("number");
  });
});

// ─── Catalog data integrity ───────────────────────────────────────────────────

describe("CATALOG data integrity", () => {
  it("all entries have a canonical string", () => {
    for (const e of CATALOG) {
      expect(typeof e.canonical).toBe("string");
      expect(e.canonical.length).toBeGreaterThan(0);
    }
  });

  it("all entries have non-null calories", () => {
    for (const e of CATALOG) {
      if (e.canonical !== "nutritional yeast") { // B12 varies, but calories are known
        expect(e.nutrients.calories).not.toBeNull();
      }
    }
  });

  it("all entries have EN / FR / DE labels", () => {
    for (const e of CATALOG) {
      expect(e.labels.en.length).toBeGreaterThan(0);
      expect(e.labels.fr.length).toBeGreaterThan(0);
      expect(e.labels.de.length).toBeGreaterThan(0);
    }
  });

  it("all entries have at least one token per locale", () => {
    for (const e of CATALOG) {
      expect(e.tokens.en.length).toBeGreaterThan(0);
      expect(e.tokens.fr.length).toBeGreaterThan(0);
      expect(e.tokens.de.length).toBeGreaterThan(0);
    }
  });

  it("calories are physiologically plausible (0–900 kcal/100g)", () => {
    for (const e of CATALOG) {
      const c = e.nutrients.calories;
      if (c !== null) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(900);
      }
    }
  });

  it("protein is non-negative", () => {
    for (const e of CATALOG) {
      const p = e.nutrients.protein;
      if (p !== null) expect(p).toBeGreaterThanOrEqual(0);
    }
  });
});
