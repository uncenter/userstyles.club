import * as http from 'node:http';

import { createRequestListener } from '@remix-run/node-fetch-server';
import { SimpleIndexer, Tap } from '@atproto/tap';

import { upsertRepoHandle } from './db/index.ts';
import { handleRecord } from './ingest.ts';
import { router } from './server.ts';

const tapUrl = process.env.TAP_URL ?? 'http://localhost:2480';
const tap = new Tap(tapUrl, { adminPassword: process.env.TAP_ADMIN_PASSWORD });

const indexer = new SimpleIndexer();

indexer.record(async (evt) => {
  const now = Date.now();
  await handleRecord(evt, now);
  // Opportunistic did presence cache; handle stays unresolved until an identity event or a later on-demand lookup fills it in.
  await upsertRepoHandle(evt.did, null, now);
});

indexer.identity(async (evt) => {
  await upsertRepoHandle(evt.did, evt.handle, Date.now());
});

indexer.error((err) => {
  console.error('tap indexer error', err);
});

const channel = tap.channel(indexer);

const listenAddr = process.env.CRAYON_LISTEN_ADDR ?? '127.0.0.1:8081';
const { hostname, port } = new URL(`http://${listenAddr}`);
const server = http.createServer(createRequestListener(router.fetch));
await new Promise<void>((resolve) => server.listen(Number(port), hostname, resolve));
console.log(`xrpc server listening on ${listenAddr}`);

console.log(`connecting to tap at ${tapUrl}...`);
await channel.start();
