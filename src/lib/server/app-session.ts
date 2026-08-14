import type { Did } from '@atcute/lexicons';
import { createKvStore } from './kv-store';

export const APP_SESSION_COOKIE = 'session';
// Matches the confidential client's max session lifetime (see src/lib/server/oauth.ts) so the app
// login doesn't expire before the underlying OAuth session would need re-auth anyway.
export const APP_SESSION_TTL_SECONDS = 60 * 60 * 24 * 180;

type StoredAppSession = { did: Did };

function appSessionStore(kv: KVNamespace) {
  return createKvStore<string, StoredAppSession>(kv, 'app-session:', {
    ttlSeconds: () => APP_SESSION_TTL_SECONDS,
  });
}

function generateSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

/** Creates an opaque app-session id mapping to `did`, distinct from the OAuth token store so the login cookie can be revoked independently. */
export async function createAppSession(kv: KVNamespace, did: Did): Promise<string> {
  const id = generateSessionId();
  await appSessionStore(kv).set(id, { did });
  return id;
}

export async function readAppSession(kv: KVNamespace, id: string): Promise<Did | undefined> {
  const session = await appSessionStore(kv).get(id);
  return session?.did;
}

export async function destroyAppSession(kv: KVNamespace, id: string): Promise<void> {
  await appSessionStore(kv).delete(id);
}
