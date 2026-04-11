import { Client, simpleFetchHandler } from '@atcute/client';
import type { Did } from '@atcute/lexicons';
import { getPdsForDid } from './did';

const clientCache = new Map<string, Client>();

export function getPublicClient(): Client {
  const key = 'public';
  if (clientCache.has(key)) return clientCache.get(key)!;

  const client = new Client({
    handler: simpleFetchHandler({ service: 'https://public.api.bsky.app' })
  });
  clientCache.set(key, client);
  return client;
}

export async function getClientForDid(did: Did): Promise<Client> {
  if (clientCache.has(did)) return clientCache.get(did)!;

  const pds = await getPdsForDid(did);
  const client = new Client({
    handler: simpleFetchHandler({ service: pds })
  });

  clientCache.set(did, client);
  return client;
}
