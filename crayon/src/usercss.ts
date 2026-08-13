import type { Blob, Did, LegacyBlob } from '@atcute/lexicons';
import { Client, ok, simpleFetchHandler } from '@atcute/client';
import type {} from '@atcute/atproto';
import type {} from '@atcute/microcosm';
import { parse } from 'usercss-parser';
import type { MozDocumentFunction, ParseResult } from 'usercss-parser';

import { getBlobCid } from './utils.ts';
import { getCachedBlobText, setCachedBlobText } from './cache.ts';

const SLINGSHOT_URL = 'https://slingshot.microcosm.blue';
const slingshot = new Client({ handler: simpleFetchHandler({ service: SLINGSHOT_URL }) });

const pdsClientCache = new Map<string, Client>();

async function getPdsClient(did: string): Promise<Client> {
  const cached = pdsClientCache.get(did);
  if (cached) return cached;

  const doc = await ok(
    slingshot.get('blue.microcosm.identity.resolveMiniDoc', {
      params: { identifier: did as Did },
    }),
  );
  const client = new Client({ handler: simpleFetchHandler({ service: doc.pds }) });
  pdsClientCache.set(did, client);
  return client;
}

async function fetchBlobText(did: string, cid: string): Promise<string> {
  const pds = await getPdsClient(did);
  const response = await ok(
    pds.get('com.atproto.sync.getBlob', { params: { did: did as Did, cid }, as: 'blob' }),
  );
  return response.text();
}

export async function getCachedBlobTextFor(did: string, cid: string): Promise<string> {
  const cached = getCachedBlobText(cid);
  if (cached !== undefined) return cached;

  const text = await fetchBlobText(did, cid);
  setCachedBlobText(cid, text);
  return text;
}

function aggregateMozDocumentRules(sections: ParseResult['sections']): MozDocumentFunction[] {
  return sections.flatMap((section) => section.matches);
}

export interface UsercssMetadata {
  mozDocumentFunctions: MozDocumentFunction[];
  userCssVars: number;
}

export async function deriveUsercssMetadata(
  did: string,
  sourceCode: Blob | LegacyBlob,
): Promise<UsercssMetadata | null> {
  try {
    const source = await getCachedBlobTextFor(did, getBlobCid(sourceCode));
    const { metadata, sections } = parse(source);
    return {
      mozDocumentFunctions: aggregateMozDocumentRules(sections),
      userCssVars: metadata?.vars.length ?? 0,
    };
  } catch (err) {
    console.warn(`failed to derive usercss metadata for ${did}`, err);
    return null;
  }
}
