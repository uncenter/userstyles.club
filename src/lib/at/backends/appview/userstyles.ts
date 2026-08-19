import { ok } from '@atcute/client';
import {
  type ActorIdentifier,
  type Blob as BlobRef,
  type CanonicalResourceUri,
  type RecordKey,
  parseCanonicalResourceUri,
} from '@atcute/lexicons';

import { getCrayonClient, resolveToDid } from '../../client';
import { CLUB_USERSTYLE_COLLECTION } from '../../settings';
import { chunk } from '../../utils';
import type { ClubUserstylesAlphaDefs } from '@userstyles.club/atcute';
import type { Userstyle, UserstyleView, UserstyleRecord } from '../../services/userstyles';

/**
 * For rebuilding a reference to a blob on protocol.
 * `mimeType`/`size` are placeholders since the appview only indexes each blob's cid.
 * Neither field is actually read anywhere blob refs get used (`getBlobCdnUrl` and `getBlobText` both fetch by `ref.$link` alone).
 */
function blobRefFromCid(cid: string, mimeType: string): BlobRef {
  return { $type: 'blob', mimeType, ref: { $link: cid }, size: 0 };
}

export function toUserstyleView(view: ClubUserstylesAlphaDefs.UserstyleView): UserstyleView {
  return {
    ...view,
    ratingAverage: view.ratingAverage !== undefined ? Number(view.ratingAverage) : undefined,
  };
}

export function userstyleViewToRecord(
  view: ClubUserstylesAlphaDefs.UserstyleView,
): UserstyleRecord {
  const value: Userstyle = {
    $type: CLUB_USERSTYLE_COLLECTION,
    title: view.title,
    description: view.description,
    license: view.license,
    upstreamUrl: view.upstreamUrl,
    homepageUrl: view.homepageUrl,
    ignoreUpdateUrl: view.ignoreUpdateUrl,
    sourceCode: blobRefFromCid(view.sourceCodeCid, 'text/plain'),
    previewImage: view.previewImageCid
      ? blobRefFromCid(view.previewImageCid, 'image/*')
      : undefined,
    createdAt: view.createdAt,
    updatedAt: view.updatedAt,
  };
  return { uri: view.uri as CanonicalResourceUri, cid: view.cid, value };
}

export async function getUserstyleFromAppview(
  repo: ActorIdentifier,
  rkey: RecordKey,
): Promise<UserstyleRecord> {
  const actor = await resolveToDid(repo);
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.getUserstyle', { params: { actor, rkey } }),
  );
  return userstyleViewToRecord(response);
}

export async function getUserstyleSourceCodeFromAppview(
  userstyle: UserstyleRecord,
): Promise<string> {
  const { repo, rkey } = parseCanonicalResourceUri(userstyle.uri);
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.getUserstyleSourceCode', {
      params: { actor: repo, rkey },
      as: 'blob',
    }),
  );
  return await response.text();
}

/** Batched userstyle-by-uri lookup, keyed by uri. Missing/deleted uris are skipped from the result. */
export async function getUserstylesFromAppview(
  uris: CanonicalResourceUri[],
): Promise<Map<CanonicalResourceUri, UserstyleRecord>> {
  const unique = [...new Set(uris)];
  if (unique.length === 0) return new Map();

  const client = getCrayonClient();
  const result = new Map<CanonicalResourceUri, UserstyleRecord>();
  await Promise.all(
    chunk(unique, 100).map(async (batch) => {
      const response = await ok(
        client.get('club.userstyles.alpha.getUserstyles', { params: { uris: batch } }),
      );
      for (const view of response.userstyles) {
        result.set(view.uri as CanonicalResourceUri, userstyleViewToRecord(view));
      }
    }),
  );
  return result;
}

export async function listAllUserstylesFromAppview(): Promise<UserstyleView[]> {
  const client = getCrayonClient();
  const response = await ok(client.get('club.userstyles.alpha.listUserstyles', { params: {} }));
  return response.userstyles.map(toUserstyleView);
}

export async function listUserstylesFromAppview(repo: ActorIdentifier): Promise<UserstyleView[]> {
  const actor = await resolveToDid(repo);
  const client = getCrayonClient();

  const userstyles: UserstyleView[] = [];
  let cursor: string | undefined;
  do {
    const response = await ok(
      client.get('club.userstyles.alpha.listUserstyles', { params: { actor, limit: 100, cursor } }),
    );
    userstyles.push(...response.userstyles.map(toUserstyleView));
    cursor = response.cursor;
  } while (cursor);

  return userstyles;
}
