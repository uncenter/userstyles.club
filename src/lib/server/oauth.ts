import { env as privateEnv } from '$env/dynamic/private';
import {
  OAuthClient,
  type ClientAssertionPrivateJwk,
  type StoredSession,
  type StoredState,
} from '@atcute/oauth-node-client';
import type { Did } from '@atcute/lexicons';

import { SlingshotActorResolver } from '$lib/at/client';
import { REDIRECT_PATH } from '$lib/at/settings';
import { oauthScope } from '$lib/at/metadata';
import { createKvStore } from './kv-store';

export function getServerOrigin(): string {
  return (
    privateEnv.SITE_ORIGIN?.trim() ||
    privateEnv.VITE_SITE_ORIGIN?.trim() ||
    'https://userstyles.club'
  );
}

let cached: { kv: KVNamespace; client: OAuthClient } | undefined;

/** Builds (and memoizes, per Worker instance) the server-side OAuth client. Bindings/secrets are only reachable via `platform.env` inside a request. */
export function getOAuthClient(env: App.Platform['env']): OAuthClient {
  if (cached && cached.kv === env.OAUTH_KV) return cached.client;

  const origin = getServerOrigin();

  const client = new OAuthClient({
    metadata: {
      client_id: `${origin}/oauth-client-metadata.json`,
      client_name: 'userstyles.club',
      client_uri: origin,
      logo_uri: `${origin}/favicon.svg`,
      tos_uri: `${origin}/`,
      policy_uri: `${origin}/`,
      redirect_uris: [`${origin}${REDIRECT_PATH}`],
      scope: oauthScope,
    },
    keyset: [JSON.parse(env.OAUTH_PRIVATE_KEY_JWK) as ClientAssertionPrivateJwk],
    actorResolver: new SlingshotActorResolver(),
    stores: {
      sessions: createKvStore<Did, StoredSession>(env.OAUTH_KV, 'oauth:session:'),
      states: createKvStore<string, StoredState>(env.OAUTH_KV, 'oauth:state:', {
        ttlSeconds: (state) => (state.expiresAt - Date.now()) / 1000,
      }),
    },
  });

  cached = { kv: env.OAUTH_KV, client };
  return client;
}
