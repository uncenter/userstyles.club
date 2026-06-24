import { user } from './oauth.svelte';

import { Client, type AtIdentifierString } from '@atproto/lex';
import * as blue from '../at/generated/blue';

const cache = new Map<string, Client>();

export function getPublicClient(): Client {
  const key = 'public';
  if (cache.has(key)) return cache.get(key)!;

  const client = new Client('https://public.api.bsky.app');
  cache.set(key, client);
  return client;
}

export function getRelayClient(): Client {
  const key = 'relay';
  if (cache.has(key)) return cache.get(key)!;

  const client = new Client('https://relay1.us-east.bsky.network');
  cache.set(key, client);
  return client;
}

export function getConstellationClient(): Client {
  const key = 'constellation';
  if (cache.has(key)) return cache.get(key)!;

  const client = new Client('https://constellation.microcosm.blue');
  cache.set(key, client);
  return client;
}

export function getSlingshotClient(): Client {
  const key = 'slingshot';
  if (cache.has(key)) return cache.get(key)!;

  const client = new Client('https://slingshot.microcosm.blue');
  cache.set(key, client);
  return client;
}

export async function getPdsClient(actor: AtIdentifierString): Promise<Client> {
  if (cache.has(actor)) return cache.get(actor)!;

  const slingshot = getSlingshotClient();
  const doc = await slingshot.call(blue.microcosm.identity.resolveMiniDoc, {
    identifier: actor,
  })
  const client = new Client(doc.pds);

  cache.set(actor, client);
  return client;
}

export function getSessionClient(error: false): Client | undefined;
export function getSessionClient(error?: string): Client;
export function getSessionClient(error: string | false = 'You must be logged in to continue.'): Client | undefined {
  if (!user.client) {
    if (error === false) return;
    throw new Error(error);
  }

  return user.client;
}
