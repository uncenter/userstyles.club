import type { Blob, Did, LegacyBlob } from '@atcute/lexicons';

export function getBlobCdnUrl(
  did: Did,
  blob: Blob | LegacyBlob,
  type: 'avatar' | 'avatar_thumbnail' | 'feed_fullsize' | 'feed_thumbnail',
): string {
  return `https://cdn.bsky.app/img/${type}/plain/${did}/${'$type' in blob ? blob.ref.$link : blob.cid}`;
}
