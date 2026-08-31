import { browser } from '$app/environment';

type CacheEntry<T> = { data: T; cachedAt: number };

/** Like {@link getCacheEntry}, but also returns the time the entry was cached at, for callers that need to compare freshness across multiple cached values. */
export function getCacheEntryWithTimestamp<T>(key: string, ttlMs: number): CacheEntry<T> | null {
  if (!browser) return null;

  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.cachedAt > ttlMs) {
      localStorage.removeItem(key);
      return null;
    }
    return entry;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function getCacheEntry<T>(key: string, ttlMs: number): T | null {
  return getCacheEntryWithTimestamp<T>(key, ttlMs)?.data ?? null;
}

export function writeCacheEntry<T>(key: string, data: T): void {
  if (!browser) return;
  localStorage.setItem(key, JSON.stringify({ data, cachedAt: Date.now() } as CacheEntry<T>));
}

export function invalidateCacheEntries(...keys: string[]): void {
  if (!browser) return;
  for (const key of keys) localStorage.removeItem(key);
}
