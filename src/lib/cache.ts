type CacheEntry<T> = { data: T; cachedAt: number };

export function getCacheEntry<T>(key: string, ttlMs: number): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const { data, cachedAt } = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - cachedAt > ttlMs) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function writeCacheEntry<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify({ data, cachedAt: Date.now() } as CacheEntry<T>));
}

export function invalidateCacheEntries(...keys: string[]): void {
  for (const key of keys) localStorage.removeItem(key);
}
