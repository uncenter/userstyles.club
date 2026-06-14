import { Client, simpleFetchHandler } from '@atcute/client';
import type { Did } from '@atcute/lexicons';
import type {} from '@atcute/microcosm';
import { getPdsForDid } from './did';

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
    handler: simpleFetchHandler({ service: 'https://constellation.microcosm.blue' }),
  });
  clientCache.set(key, client);
  return client;
}

export async function getClientForDid(did: Did): Promise<Client> {
  if (clientCache.has(did)) return clientCache.get(did)!;

  const pds = await getPdsForDid(did);
  const client = new Client({
    handler: simpleFetchHandler({ service: pds }),
  });

  clientCache.set(did, client);
  return client;
}
