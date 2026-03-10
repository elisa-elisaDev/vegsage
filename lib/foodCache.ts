/**
 * Food search cache — Layer 4 of the VegSage search architecture.
 *
 * TTL-based in-memory cache for USDA search results.
 * Separate from any inline caching in usdaClient.ts for clarity and testability.
 *
 * Cache key format: "search:{englishQuery}:{limit}:{locale}"
 *                or "barcode:{code}:{locale}"
 */

import type { FoodProduct } from "./usdaClient";

export interface CachedFood {
  canonical: string;
  label: string;
  calories: number | null;
  protein: number | null;
  fdcId: string;
}

interface CacheEntry {
  products: FoodProduct[];
  ts: number;
}

class FoodCache {
  private readonly store = new Map<string, CacheEntry>();
  private readonly ttlMs: number;

  constructor(ttlMs = 5 * 60 * 1000) {
    this.ttlMs = ttlMs;
  }

  get(key: string): FoodProduct[] | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > this.ttlMs) {
      this.store.delete(key);
      return null;
    }
    return entry.products;
  }

  set(key: string, products: FoodProduct[]): void {
    this.store.set(key, { products, ts: Date.now() });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /** Remove a specific entry (e.g. after stale detection). */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /** Clear all cached entries. */
  clear(): void {
    this.store.clear();
  }

  /** Number of live (non-expired) entries. */
  get size(): number {
    let count = 0;
    const now = Date.now();
    for (const entry of this.store.values()) {
      if (now - entry.ts <= this.ttlMs) count++;
    }
    return count;
  }
}

/** Singleton cache — shared across all requests in the same Node.js process. */
export const foodCache = new FoodCache();
