/**
 * useSemanticSearch.ts
 * ---------------------
 * Zero-cost semantic search for the Happy Greens storefront.
 *
 * Features:
 *  - Auto-generated synonym map from product data (category_name + name tokens)
 *  - Query expansion via synonym map before search
 *  - Fuse.js fuzzy search (memoized instance, rebuilt only when products change)
 *  - Multi-signal ranking: exact match, category match, popularity
 *  - Debounced input (300ms default)
 *  - Safe to compose with existing category filters — does NOT reset them
 *
 * Usage:
 *   const { searchQuery, setSearchQuery, searchedProducts } = useSemanticSearch(products);
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Fuse, { IFuseOptions, FuseResult } from 'fuse.js';

// ---------------------------------------------------------------------------
// 1. SYNONYM MAP — built dynamically from product data
// ---------------------------------------------------------------------------

function buildSynonymMap(products: any[]): Map<string, string[]> {
  const map = new Map<string, Set<string>>();

  const tokenise = (str = ''): string[] =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((t) => t.length > 2);

  const addRelation = (a: string, b: string) => {
    if (a === b) return;
    if (!map.has(a)) map.set(a, new Set());
    map.get(a)!.add(b);
  };

  products.forEach((product) => {
    const nameTokens = tokenise(product.name);
    const catTokens = tokenise(product.category_name || '');
    const allTokens = [...nameTokens, ...catTokens];

    allTokens.forEach((t1) => {
      allTokens.forEach((t2) => addRelation(t1, t2));
    });
  });

  const result = new Map<string, string[]>();
  map.forEach((synonyms, token) => {
    result.set(token, [...synonyms]);
  });
  return result;
}

// ---------------------------------------------------------------------------
// 2. QUERY EXPANSION
// ---------------------------------------------------------------------------

function expandQuery(query: string, synonymMap: Map<string, string[]>): string {
  const tokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  const expanded = new Set(tokens);

  tokens.forEach((token) => {
    const syns = synonymMap.get(token) || [];
    syns.forEach((s) => expanded.add(s));
  });

  return [...expanded].join(' ');
}

// ---------------------------------------------------------------------------
// 3. RANKING LOGIC
// ---------------------------------------------------------------------------

function rankResults(fuseResults: FuseResult<any>[], rawQuery: string, allProducts: any[]): any[] {
  if (!fuseResults.length) return [];

  const lowerQuery = rawQuery.toLowerCase().trim();

  const maxPopularity = Math.max(
    ...allProducts.map((p) => p.popularity ?? 0),
    1
  );

  return fuseResults
    .map(({ item, score: fuseScore }) => {
      const baseScore = 1 - (fuseScore ?? 1);

      // Exact match boost
      const exactBoost =
        item.name?.toLowerCase().includes(lowerQuery) ? 0.5 : 0;

      // Category match boost
      const catName = (item.category_name || '').toLowerCase();
      const categoryBoost =
        catName.includes(lowerQuery) || lowerQuery.includes(catName || '__none__')
          ? 0.2
          : 0;

      // Popularity boost (proportional, capped at 0.3)
      const popularityBoost = ((item.popularity ?? 0) / maxPopularity) * 0.3;

      const composite = baseScore + exactBoost + categoryBoost + popularityBoost;

      return { item, composite };
    })
    .sort((a, b) => b.composite - a.composite)
    .map(({ item }) => item);
}

// ---------------------------------------------------------------------------
// 4. FUSE.JS CONFIG
// ---------------------------------------------------------------------------

const FUSE_OPTIONS: IFuseOptions<any> = {
  keys: [
    { name: 'name', weight: 0.6 },
    { name: 'category_name', weight: 0.25 },
    { name: 'description', weight: 0.15 },
  ],
  includeScore: true,
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

// ---------------------------------------------------------------------------
// 5. DEBOUNCE HOOK
// ---------------------------------------------------------------------------

function useDebounce(value: string, delay = 300): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

// ---------------------------------------------------------------------------
// 6. MAIN HOOK
// ---------------------------------------------------------------------------

interface UseSemanticSearchOptions {
  debounceMs?: number;
}

export function useSemanticSearch(
  products: any[],
  { debounceMs = 300 }: UseSemanticSearchOptions = {}
) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, debounceMs);

  // Synonym map: rebuilt only when products array reference changes
  const synonymMap = useMemo(() => buildSynonymMap(products), [products]);

  // Fuse instance: rebuilt only when products array reference changes
  const fuseRef = useRef<Fuse<any> | null>(null);
  useMemo(() => {
    fuseRef.current = new Fuse(products, FUSE_OPTIONS);
  }, [products]);

  // Search + rank: only recomputes when debounced query or products change
  const searchedProducts = useMemo(() => {
    const trimmed = debouncedQuery.trim();

    // No query → return full list in original order
    if (!trimmed) return products;

    // Step 1: expand query with synonyms
    const expandedQuery = expandQuery(trimmed, synonymMap);

    // Step 2: fuzzy search against expanded query
    const fuseResults = fuseRef.current!.search(expandedQuery);

    // Step 3: rank by composite score
    return rankResults(fuseResults, trimmed, products);
  }, [debouncedQuery, products, synonymMap]);

  // Stable setter reference
  const handleSetSearchQuery = useCallback((value: string | React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(typeof value === 'string' ? value : value.target.value);
  }, []);

  return {
    searchQuery,
    setSearchQuery: handleSetSearchQuery,
    searchedProducts,
  };
}
