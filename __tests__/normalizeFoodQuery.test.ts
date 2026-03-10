/**
 * Tests for the VegSage food search engine — Layers 1 & 2.
 *
 * Covers:
 * - normalizeFoodQuery: all 11 required food queries
 * - stripAccents: accent removal
 * - fuzzyMatch: Levenshtein tolerance
 * - fuzzyNormalizeFoodQuery: typo recovery
 * - searchFoodIndex: local index lookup
 */

import {
  normalizeFoodQuery,
  stripAccents,
  fuzzyMatch,
  levenshtein,
  fuzzyNormalizeFoodQuery,
} from "../lib/normalizeFoodQuery";
import { searchFoodIndex } from "../lib/searchFoodIndex";

// ─── stripAccents ──────────────────────────────────────────────────────────────

describe("stripAccents", () => {
  it("removes French accents", () => {
    expect(stripAccents("épinards")).toBe("epinards");
    expect(stripAccents("pêche")).toBe("peche");
    expect(stripAccents("maïs")).toBe("mais");
    expect(stripAccents("noix de cœur")).toBe("noix de coeur");
  });

  it("converts ligature œ to oe", () => {
    expect(stripAccents("œufs")).toBe("oeufs");
    expect(stripAccents("œuf")).toBe("oeuf");
  });

  it("converts ß to ss", () => {
    expect(stripAccents("straße")).toBe("strasse");
  });

  it("removes German umlauts", () => {
    expect(stripAccents("käse")).toBe("kase");
    expect(stripAccents("grünkohl")).toBe("grunkohl");
    expect(stripAccents("walnüsse")).toBe("walnusse");
  });

  it("leaves already-plain text unchanged", () => {
    expect(stripAccents("tofu")).toBe("tofu");
    expect(stripAccents("lentils")).toBe("lentils");
  });
});

// ─── levenshtein ──────────────────────────────────────────────────────────────

describe("levenshtein", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("yogurt", "yogurt")).toBe(0);
  });

  it("handles empty strings", () => {
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("abc", "")).toBe(3);
  });

  it("computes distance for simple typos", () => {
    expect(levenshtein("linzen", "linsen")).toBe(1);  // z→s
    expect(levenshtein("yoghrt", "yogurt")).toBe(1);  // h→u (single substitution)
    expect(levenshtein("lentile", "lentils")).toBe(1); // e→s (single substitution)
  });
});

// ─── fuzzyMatch ───────────────────────────────────────────────────────────────

describe("fuzzyMatch", () => {
  it("matches identical strings", () => {
    expect(fuzzyMatch("lentils", "lentils")).toBe(true);
  });

  it("matches 1-character typos", () => {
    expect(fuzzyMatch("linzen", "linsen")).toBe(true);   // 1 substitution
  });

  it("matches 2-character typos for medium words", () => {
    expect(fuzzyMatch("yoghrt", "yogurt")).toBe(true);
  });

  it("rejects completely different words", () => {
    expect(fuzzyMatch("apple", "lentils")).toBe(false);
    expect(fuzzyMatch("tofu", "pasta")).toBe(false);
  });
});

// ─── normalizeFoodQuery — required test cases ─────────────────────────────────

describe("normalizeFoodQuery — 11 required queries", () => {
  // FR
  it("lentilles → lentils", () => {
    expect(normalizeFoodQuery("lentilles")).toBe("lentils");
  });

  it("linsen → lentils (DE)", () => {
    expect(normalizeFoodQuery("linsen")).toBe("lentils");
  });

  it("oeufs → eggs (FR, no ligature)", () => {
    expect(normalizeFoodQuery("oeufs")).toBe("eggs");
  });

  it("œufs → eggs (FR, with ligature)", () => {
    expect(normalizeFoodQuery("œufs")).toBe("eggs");
  });

  it("yoghourt → yogurt (FR alternate spelling)", () => {
    expect(normalizeFoodQuery("yoghourt")).toBe("yogurt");
  });

  it("yaourt → yogurt (FR standard)", () => {
    expect(normalizeFoodQuery("yaourt")).toBe("yogurt");
  });

  it("cornichons → pickles (FR)", () => {
    expect(normalizeFoodQuery("cornichons")).toBe("pickles");
  });

  it("salade → lettuce (FR)", () => {
    expect(normalizeFoodQuery("salade")).toBe("lettuce");
  });

  it("salade verte → lettuce (FR multi-word)", () => {
    expect(normalizeFoodQuery("salade verte")).toBe("lettuce");
  });

  it("fenouil → fennel (FR)", () => {
    expect(normalizeFoodQuery("fenouil")).toBe("fennel");
  });

  it("tofu → tofu (same in all locales)", () => {
    expect(normalizeFoodQuery("tofu")).toBe("tofu");
  });
});

// ─── normalizeFoodQuery — additional coverage ─────────────────────────────────

describe("normalizeFoodQuery — additional cases", () => {
  it("handles uppercase input", () => {
    expect(normalizeFoodQuery("LENTILLES")).toBe("lentils");
    expect(normalizeFoodQuery("Épinards")).toBe("spinach");
  });

  it("handles leading/trailing whitespace", () => {
    expect(normalizeFoodQuery("  lentilles  ")).toBe("lentils");
  });

  it("strips accents before lookup — œufs via accent strip → oeufs → eggs", () => {
    expect(normalizeFoodQuery("œufs")).toBe("eggs");
  });

  it("translates DE: linsen → lentils", () => {
    expect(normalizeFoodQuery("Linsen")).toBe("lentils");
  });

  it("translates DE: eier → eggs", () => {
    expect(normalizeFoodQuery("eier")).toBe("eggs");
  });

  it("translates DE: joghurt → yogurt", () => {
    expect(normalizeFoodQuery("joghurt")).toBe("yogurt");
  });

  it("translates compound: lentilles cuites → lentils cooked", () => {
    const result = normalizeFoodQuery("lentilles cuites");
    expect(result).toContain("lentils");
  });

  it("translates compound: salade mixte → lettuce", () => {
    expect(normalizeFoodQuery("salade mixte")).toBe("lettuce");
  });

  it("returns accent-stripped passthrough for unknown words", () => {
    expect(normalizeFoodQuery("rutabaga")).toBe("rutabaga");
  });

  it("handles empty string gracefully", () => {
    expect(normalizeFoodQuery("")).toBe("");
  });
});

// ─── fuzzyNormalizeFoodQuery ──────────────────────────────────────────────────

describe("fuzzyNormalizeFoodQuery — typo recovery", () => {
  it("linzen → lentils (z→s typo)", () => {
    expect(fuzzyNormalizeFoodQuery("linzen")).toBe("lentils");
  });

  it("yoghrt → yogurt (missing letters)", () => {
    expect(fuzzyNormalizeFoodQuery("yoghrt")).toBe("yogurt");
  });
});

// ─── searchFoodIndex ──────────────────────────────────────────────────────────

describe("searchFoodIndex — local index lookup", () => {
  it("finds lentils from FR token", () => {
    const results = searchFoodIndex("lentilles");
    expect(results).toContain("lentils");
  });

  it("finds lentils from DE token", () => {
    const results = searchFoodIndex("linsen");
    expect(results).toContain("lentils");
  });

  it("finds eggs from oeufs (no ligature)", () => {
    const results = searchFoodIndex("oeufs");
    expect(results).toContain("eggs");
  });

  it("finds yogurt from yaourt", () => {
    const results = searchFoodIndex("yaourt");
    expect(results).toContain("yogurt");
  });

  it("finds yogurt from yoghourt", () => {
    const results = searchFoodIndex("yoghourt");
    expect(results).toContain("yogurt");
  });

  it("finds pickles from cornichons", () => {
    const results = searchFoodIndex("cornichons");
    expect(results).toContain("pickles");
  });

  it("finds lettuce from salade", () => {
    const results = searchFoodIndex("salade");
    expect(results).toContain("lettuce");
  });

  it("finds fennel from fenouil", () => {
    const results = searchFoodIndex("fenouil");
    expect(results).toContain("fennel");
  });

  it("finds tofu", () => {
    const results = searchFoodIndex("tofu");
    expect(results).toContain("tofu");
  });

  it("finds lentils from linzen via fuzzy match", () => {
    const results = searchFoodIndex("linzen");
    expect(results).toContain("lentils");
  });

  it("returns empty array for empty query", () => {
    expect(searchFoodIndex("")).toEqual([]);
  });

  it("returns empty array for completely unknown food", () => {
    const results = searchFoodIndex("xyznonexistent12345");
    expect(results).toEqual([]);
  });
});
