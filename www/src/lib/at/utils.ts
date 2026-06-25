import type { Blob, Did, LegacyBlob } from '@atcute/lexicons';
import { getPdsForDid } from './did';

export async function getBlobPdsUrl(did: Did, cid: string): Promise<string> {
  const pds = await getPdsForDid(did);
  return `${pds}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(did)}&cid=${encodeURIComponent(cid)}`;
}

export function getBlobCdnUrl(
  did: Did,
  blob: Blob | LegacyBlob,
  type: 'avatar' | 'avatar_thumbnail' | 'feed_fullsize' | 'feed_thumbnail',
): string {
  return `https://cdn.bsky.app/img/${type}/plain/${did}/${'$type' in blob ? blob.ref.toString() : blob.cid}`;
}
