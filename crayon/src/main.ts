import * as http from 'node:http';

import { createRequestListener } from '@remix-run/node-fetch-server';
import { TapClient } from '@atcute/tap';

import { handleRecord } from './ingest.ts';
import { router } from './server.ts';

const TAP_URL = process.env.TAP_URL ?? 'http://localhost:2480';
const tap = new TapClient({ url: TAP_URL, adminPassword: process.env.TAP_ADMIN_PASSWORD });

const CRAYON_ADDR = process.env.CRAYON_LISTEN_ADDR ?? '127.0.0.1:8080';
const { hostname, port } = new URL(`http://${CRAYON_ADDR}`);
const server = http.createServer(createRequestListener(router.fetch));
await new Promise<void>((resolve) => server.listen(Number(port), hostname, resolve));
console.log(`xrpc server listening on ${CRAYON_ADDR}`);

console.log(`connecting to tap at ${TAP_URL}...`);
for await (const { event, ack } of tap.subscribe()) {
  try {
    if (event.type === 'record') {
      await handleRecord(event, Date.now());
    }
    await ack();
  } catch (err) {
    // don't ack on error - let tap retry delivery later
    console.error('tap indexer error', err);
  }
}
