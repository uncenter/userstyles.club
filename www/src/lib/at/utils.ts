import { getBlobCidString, type BlobRef } from "@atproto/lex";
import type { DidString } from "@atproto/syntax";

// export async function getBlobPdsUrl(did: Did, cid: string): Promise<string> {
//   const pds = await getPdsForDid(did);
//   return `${pds}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(did)}&cid=${encodeURIComponent(cid)}`;
// }

export function getBlobCdnUrl(
  did: DidString,
  blob: BlobRef,
  type: 'avatar' | 'avatar_thumbnail' | 'feed_fullsize' | 'feed_thumbnail',
): string {
  return `https://cdn.bsky.app/img/${type}/plain/${did}/${getBlobCidString(blob)}`;
}
