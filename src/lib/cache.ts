/**
 * Simple in-memory + localStorage cache to minimize Firestore reads.
 *
 * Strategy:
 *  - Public/shared data (leaderboard, contests, contestResults) is cached
 *    for TTL_MS after first fetch. Subsequent reads within the TTL are served
 *    from memory (0 Firestore reads).
 *  - User-specific data (participant doc) stays on a real-time listener so
 *    admin changes (badges, rating) reflect instantly.
 *  - Cache is busted when an admin writes data (importResults, etc.) via
 *    invalidate().
 */

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

// How long to serve from cache before re-fetching (5 minutes)
const TTL_MS = 5 * 60 * 1000;

// In-memory store — cleared on page refresh automatically
const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > TTL_MS) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function cacheSet<T>(key: string, data: T): void {
  store.set(key, { data, fetchedAt: Date.now() });
}

export function cacheInvalidate(key: string): void {
  store.delete(key);
}

export function cacheInvalidateAll(): void {
  store.clear();
}

/** Wrap a Firestore fetch so it only runs once per TTL window. */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== null) return cached;
  const data = await fetcher();
  cacheSet(key, data);
  return data;
}
