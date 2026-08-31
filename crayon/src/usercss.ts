import type { Blob, Did, LegacyBlob } from '@atcute/lexicons';
import { Client, ok, simpleFetchHandler } from '@atcute/client';
import type {} from '@atcute/atproto';
import type {} from '@atcute/microcosm';
import { parse } from 'usercss-parser';
import type { MozDocumentFunction, ParseResult } from 'usercss-parser';

import { getBlobCid } from './utils.ts';
import { getCachedSourceCode, setCachedSourceCode } from './db/index.ts';
import { resolveActor } from './identity.ts';

async function fetchBlobText(did: string, cid: string): Promise<string> {
  const identity = await resolveActor(did);
  if (!identity) throw new Error(`could not resolve pds for ${did}`);
  const pds = new Client({ handler: simpleFetchHandler({ service: identity.pds }) });
  const response = await ok(
    pds.get('com.atproto.sync.getBlob', { params: { did: did as Did, cid }, as: 'blob' }),
  );
  return response.text();
}

/** Retrieves the given addressed source code blob. First attempts retrieving from the (persistent) Postgres table before falling back to the source blob directly from the PDS. */
export async function getSourceCode(did: string, cid: string): Promise<string> {
  try {
    const cached = await getCachedSourceCode(cid);
    if (cached !== null) return cached;
  } catch (err) {
    console.warn(`failed to read source code cache for cid ${cid}`, err);
  }

  const text = await fetchBlobText(did, cid);

  try {
    await setCachedSourceCode(cid, text, Date.now());
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
    const source = await getSourceCode(did, getBlobCid(sourceCode));
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
