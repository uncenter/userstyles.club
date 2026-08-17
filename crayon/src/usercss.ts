import type { Blob, Did, LegacyBlob } from '@atcute/lexicons';
import { Client, ok, simpleFetchHandler } from '@atcute/client';
import type {} from '@atcute/atproto';
import type {} from '@atcute/microcosm';
import { parse } from 'usercss-parser';
import type { MozDocumentFunction, ParseResult } from 'usercss-parser';

import { getBlobCid } from './utils.ts';
import { getMemCachedSourceCode, setMemCachedSourceCode } from './cache.ts';
import { getDbCachedSourceCode, setDbCachedSourceCode } from './db/index.ts';

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

/** Retrieves the given addressed source code blob. First attempts retrieving from the in-memory hot cache, then the (persistent) Postgres table, and finally falling back to the source blob's resident PDS. */
export async function getCachedSourceCode(did: string, cid: string): Promise<string> {
  const memCached = getMemCachedSourceCode(cid);
  if (memCached !== undefined) return memCached;

  try {
    const dbCached = await getDbCachedSourceCode(cid);
    if (dbCached !== null) {
      setMemCachedSourceCode(cid, dbCached);
      return dbCached;
    }
  } catch (err) {
    console.warn(`failed to read source code cache for cid ${cid}`, err);
  }

  const text = await fetchBlobText(did, cid);
  setMemCachedSourceCode(cid, text);

  try {
    await setDbCachedSourceCode(cid, text, Date.now());
  } catch (err) {
    console.warn(`failed to persist source code cache for cid ${cid}`, err);
  }

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
    const source = await getCachedSourceCode(did, getBlobCid(sourceCode));
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
