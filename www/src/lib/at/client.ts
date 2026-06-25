import { Client, ok, simpleFetchHandler } from '@atcute/client';
import type { ActorIdentifier } from '@atcute/lexicons';
import type {} from '@atcute/microcosm';
import { CONSTELLATION_URL, SLINGSHOT_URL } from './settings';

const clientCache = new Map<string, Client>();

export function getPublicClient(): Client {
  const key = 'public';
  if (clientCache.has(key)) return clientCache.get(key)!;

  const client = new Client({
    handler: simpleFetchHandler({ service: 'https://public.api.bsky.app' }),
  });
  clientCache.set(key, client);
  return client;
}

export function getRelayClient(): Client {
  const key = 'relay';
  if (clientCache.has(key)) return clientCache.get(key)!;

  const client = new Client({
    handler: simpleFetchHandler({ service: 'https://relay1.us-east.bsky.network' }),
  });
  clientCache.set(key, client);
  return client;
}

export function getConstellationClient(): Client {
  const key = 'constellation';
  if (clientCache.has(key)) return clientCache.get(key)!;

  const client = new Client({
    handler: simpleFetchHandler({ service: CONSTELLATION_URL }),
  });
  clientCache.set(key, client);
  return client;
}

export function getSlingshotClient(): Client {
  const key = 'slingshot';
  if (clientCache.has(key)) return clientCache.get(key)!;

  const client = new Client({
    handler: simpleFetchHandler({ service: SLINGSHOT_URL }),
  });
  clientCache.set(key, client);
  return client;
}

export async function getPdsClient(actor: ActorIdentifier): Promise<Client> {
  if (clientCache.has(actor)) return clientCache.get(actor)!;

  const slingshot = getSlingshotClient();
  const doc = await ok(
    slingshot.get('blue.microcosm.identity.resolveMiniDoc', {
      params: {
        identifier: actor,
      }
    })
  );
  const client = new Client({
    handler: simpleFetchHandler({ service: doc.pds }),
  });

  clientCache.set(actor, client);
  return client;
}
