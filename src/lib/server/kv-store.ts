import type { Store } from '@atcute/oauth-node-client';

/** Generic `Store` backed by a Cloudflare KV namespace, scoped under a key prefix. */
export function createKvStore<K extends string, V>(
  kv: KVNamespace,
  prefix: string,
  options?: {
    /** Derives a KV expiration TTL (seconds) from the value being stored; omit for no expiry. */
    ttlSeconds?: (value: V) => number | undefined;
  },
): Store<K, V> {
  return {
    async get(key) {
      const value = await kv.get<V>(`${prefix}${key}`, 'json');
      return value ?? undefined;
    },
    async set(key, value) {
      const ttl = options?.ttlSeconds?.(value);
      await kv.put(`${prefix}${key}`, JSON.stringify(value), {
        // KV requires a minimum TTL of 60 seconds.
        expirationTtl: ttl !== undefined ? Math.max(60, Math.ceil(ttl)) : undefined,
      });
    },
    async delete(key) {
      await kv.delete(`${prefix}${key}`);
    },
    async clear() {
      let cursor: string | undefined;
      do {
        const listed: {
          keys: { name: string }[];
          list_complete: boolean;
          cursor?: string;
        } = await kv.list({ prefix, cursor });
        await Promise.all(listed.keys.map((k) => kv.delete(k.name)));
        cursor = listed.list_complete ? undefined : listed.cursor;
      } while (cursor);
    },
  };
}
