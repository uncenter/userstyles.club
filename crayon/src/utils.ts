import type { Blob, LegacyBlob } from '@atcute/lexicons';

/** Get the cid of a blob, regardless of whether it's the current (`ref.$link`) or legacy blob shape. */
export function getBlobCid(blob: Blob | LegacyBlob): string {
  return '$type' in blob ? blob.ref.$link : blob.cid;
}
