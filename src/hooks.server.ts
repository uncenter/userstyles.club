import type { Handle } from '@sveltejs/kit';
import type { Did } from '@atcute/lexicons';
import { building } from '$app/environment';
import { APP_SESSION_COOKIE, readAppSession } from '$lib/server/app-session';

export const handle: Handle = async ({ event, resolve }) => {
  // platform.env throws if accessed while prerendering (no real Workers bindings at build time).
  const kv = building ? undefined : event.platform?.env.OAUTH_KV;
  const sessionId = event.cookies.get(APP_SESSION_COOKIE);

  let did: Did | undefined;
  if (kv && sessionId) {
    did = await readAppSession(kv, sessionId);
  }

  // Doesn't restore the full OAuth client/session here (that does a token-refresh check) -
  // routes that need an authenticated PDS call do that themselves via getSessionContext().
  event.locals.session = did ? { did } : null;

  return resolve(event);
};
