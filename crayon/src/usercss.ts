import type { Blob, Did, LegacyBlob } from '@atcute/lexicons';
import { Client, ok, simpleFetchHandler } from '@atcute/client';
import type {} from '@atcute/atproto';
import type {} from '@atcute/microcosm';
import { parse } from 'usercss-parser';
import type { MozDocumentFunction, ParseResult } from 'usercss-parser';

import { getBlobCid } from './utils.ts';
import { getMemCachedSourceCode, setMemCachedSourceCode } from './cache.ts';
import { getDbCachedSourceCode, setDbCachedSourceCode } from './db/index.ts';
import { resolveActor } from './identity.ts';

const pdsClientCache = new Map<string, Client>();

function getPdsClient(pds: string): Client {
  const cached = pdsClientCache.get(pds);
  if (cached) return cached;
  const client = new Client({ handler: simpleFetchHandler({ service: pds }) });
  pdsClientCache.set(pds, client);
  return client;
}

async function fetchBlobText(did: string, cid: string): Promise<string> {
  const identity = await resolveActor(did);
  if (!identity) throw new Error(`could not resolve pds for ${did}`);
  const pds = getPdsClient(identity.pds);
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
