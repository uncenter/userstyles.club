// Content-addressed cache for userstyle source text blobs, keyed by cid.

const MAX_TOTAL_BYTES = 64 * 1024 * 1024; // 64 MiB
const MAX_ENTRY_BYTES = 4 * 1024 * 1024; // 4 MiB

const cache = new Map<string, string>();
let currentCacheBytes = 0;

function getLengthInBytes(text: string): number {
  return Buffer.byteLength(text, 'utf8');
}

export function getMemCachedSourceCode(cid: string): string | undefined {
  const cached = cache.get(cid);
  if (cached === undefined) return undefined;

  cache.delete(cid);
  cache.set(cid, cached);
  return cached;
}

export function setMemCachedSourceCode(cid: string, text: string): void {
  const size = getLengthInBytes(text);
  if (size > MAX_ENTRY_BYTES) return;

  const existing = cache.get(cid);
  if (existing !== undefined) {
    currentCacheBytes -= getLengthInBytes(existing);
    cache.delete(cid);
  }

  cache.set(cid, text);
  currentCacheBytes += size;

  for (const [key, value] of cache) {
    if (currentCacheBytes <= MAX_TOTAL_BYTES) break;
    cache.delete(key);
    currentCacheBytes -= getLengthInBytes(value);
  }
}
