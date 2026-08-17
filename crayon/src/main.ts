import * as http from 'node:http';

import { createRequestListener } from '@remix-run/node-fetch-server';
import { Jetstream, type CursorStore } from '@bsky/jetstream';

import { getIngestCursor, saveIngestCursor } from './db/index.ts';
import { COLLECTIONS, handleRecord } from './ingest.ts';
import { router } from './server.ts';

const JETSTREAM_SERVICE = process.env.JETSTREAM_SERVICE ?? 'https://jetstream.us-east.bsky.network';
const jetstream = new Jetstream({
  service: JETSTREAM_SERVICE,
  apiKey: process.env.JETSTREAM_API_KEY || undefined,
});

const CRAYON_ADDR = process.env.CRAYON_LISTEN_ADDR ?? '127.0.0.1:8080';
const { hostname, port } = new URL(`http://${CRAYON_ADDR}`);
const server = http.createServer(createRequestListener(router.fetch));
await new Promise<void>((resolve) => server.listen(Number(port), hostname, resolve));
console.log(`xrpc server listening on ${CRAYON_ADDR}`);

const cursor: CursorStore = { load: getIngestCursor, save: saveIngestCursor };

console.log(`connecting to jetstream at ${JETSTREAM_SERVICE}...`);
for await (const event of jetstream.replay({
  collections: COLLECTIONS,
  kinds: ['commit'],
  cursor,
  onError: (err) => console.error('jetstream indexer error', err),
})) {
  try {
    await handleRecord(event, Date.now());
    await cursor.save(event.seq);
  } catch (err) {
    console.error('jetstream indexer error', err);
  }
}
