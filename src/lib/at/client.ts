import { Client, ok, simpleFetchHandler } from '@atcute/client';
import type { ActorIdentifier, Did } from '@atcute/lexicons';
import { isDid } from '@atcute/lexicons/syntax';
import type {} from '@atcute/microcosm';
import { getConstellationUrl, getCrayonUrl, getSlingshotUrl } from './settings';

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
  const url = getConstellationUrl();
  const key = `constellation:${url}`;
  if (clientCache.has(key)) return clientCache.get(key)!;

  const client = new Client({ handler: simpleFetchHandler({ service: url }) });
  clientCache.set(key, client);
  return client;
}

export function getSlingshotClient(): Client {
  const url = getSlingshotUrl();
  const key = `slingshot:${url}`;
  if (clientCache.has(key)) return clientCache.get(key)!;

  const client = new Client({ handler: simpleFetchHandler({ service: url }) });
  clientCache.set(key, client);
  return client;
}

export function getCrayonClient(): Client {
  const url = getCrayonUrl();
  const key = `crayon:${url}`;
  if (clientCache.has(key)) return clientCache.get(key)!;

  const client = new Client({ handler: simpleFetchHandler({ service: url }) });
  clientCache.set(key, client);
  return client;
}

// TODO: Cache DID-handle resolutions to avoid repeat resolves for the same actor.
/** Crayon's actor params are did-only, handles need resolving first while dids pass through with no extra request. */
export async function resolveToDid(actor: ActorIdentifier): Promise<Did> {
  if (isDid(actor)) return actor;
  const doc = await ok(
    getSlingshotClient().get('blue.microcosm.identity.resolveMiniDoc', {
      params: { identifier: actor },
    }),
  );
  return doc.did;
}

export async function getPdsClient(actor: ActorIdentifier): Promise<Client> {
  if (clientCache.has(actor)) return clientCache.get(actor)!;

  const slingshot = getSlingshotClient();
  const doc = await ok(
    slingshot.get('blue.microcosm.identity.resolveMiniDoc', {
      params: {
        identifier: actor,
      },
    }),
  );
  const client = new Client({
    handler: simpleFetchHandler({ service: doc.pds }),
  });

  clientCache.set(actor, client);
  return client;
}
