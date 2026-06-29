import type { Client } from '@atcute/client';
import type { Did } from '@atcute/lexicons';
import { user } from './oauth.svelte';

export type SessionContext = {
  client: Client;
  did: Did;
};

export function getSessionContext(message = 'You must be logged in to continue.'): SessionContext {
  if (!user.isLoggedIn || !user.client || !user.did) {
    throw new Error(message);
  }

  return {
    client: user.client,
    did: user.did,
  };
}
