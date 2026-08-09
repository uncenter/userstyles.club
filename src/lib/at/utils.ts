import type { Blob, Cid, Did, LegacyBlob } from '@atcute/lexicons';

/** Get the cid of a blob, regardless of whether it's the current (`ref.$link`) or legacy blob shape. */
export function getBlobCid(blob: Blob | LegacyBlob): string {
  return '$type' in blob ? blob.ref.$link : blob.cid;
}

export function getBlobCdnUrl(
  did: Did,
  blob: Blob | LegacyBlob | Cid,
  type: 'avatar' | 'avatar_thumbnail' | 'feed_fullsize' | 'feed_thumbnail',
): string {
  return `https://cdn.bsky.app/img/${type}/plain/${did}/${typeof blob === "string" ? blob : getBlobCid(blob)}`;
}

export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}
