import { Client } from '@atcute/client';
import type { Did } from '@atcute/lexicons';
import { getRequestEvent } from '$app/server';
import { getOAuthClient } from './oauth';

export type SessionContext = {
  client: Client;
  did: Did;
};

/** Restores the caller's authenticated PDS client from the current request's session cookie. */
export async function getSessionContext(
  message = 'You must be logged in to continue.',
): Promise<SessionContext> {
  const { locals, platform } = getRequestEvent();

  if (!locals.session || !platform) {
    throw new Error(message);
  }

  const session = await getOAuthClient(platform.env).restore(locals.session.did);
  const client = new Client({ handler: session });

  return { client, did: locals.session.did };
}
