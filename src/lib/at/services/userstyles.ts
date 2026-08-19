import { getSessionContext } from '../auth';
import {
  getUserstyleFromAppview,
  getUserstylesFromAppview,
  getUserstyleSourceCodeFromAppview,
  listAllUserstylesFromAppview,
  listUserstylesFromAppview,
} from '../backends/appview/userstyles';
import {
  getUserstyleFromPds,
  getUserstyleSourceCodeFromPds,
  listAllUserstylesFromRelay,
  listUserstylesFromPds,
} from '../backends/fallback/userstyles';
import { getFeedbackFromAppview } from '../backends/appview/feedback';
import { getFeedbackFromConstellation } from '../backends/fallback/feedback';
import { createRecord, deleteRecord, putRecord, uploadBlob, type RepoRecord } from '../records';

import type { CommentThreadNode } from './comments';

import { ClientResponseError } from '@atcute/client';
import {
  type ActorIdentifier,
  type RecordKey,
  type CanonicalResourceUri,
  parseCanonicalResourceUri,
} from '@atcute/lexicons';

import { makeRecordBuilder } from '../builder';
import { CLUB_USERSTYLE_COLLECTION, isAppviewEnabled } from '../settings';
import {
  ClubUserstylesAlphaUserstyle,
  type ClubUserstylesAlphaDefs,
} from '@userstyles.club/atcute';

export type Userstyle = ClubUserstylesAlphaUserstyle.Main;

export type UserstyleView = Omit<
  ClubUserstylesAlphaDefs.UserstyleView,
  'commentCount' | 'ratingAverage'
> & {
  commentCount?: number; // comment count loosed to optional here since it is unused by the frontend, returned by the appview by default, but expensive to (needlessly) fetch from the fallback backend.
  ratingAverage?: number; // widened from the lexicon's string (there is no float type).
};

export type UserstyleContent = Omit<
  Userstyle,
  '$type' | 'previewImage' | 'sourceCode' | 'createdAt' | 'updatedAt'
> & {
  sourceCode: string;
};

export type UserstyleInput<
  Options extends { previewImage?: any; createdAt?: Userstyle['createdAt'] } = Record<never, never>,
> = UserstyleContent & Options;

export type UserstyleRecord = RepoRecord<Userstyle>;

const builder = makeRecordBuilder(
  ClubUserstylesAlphaUserstyle.mainSchema,
  CLUB_USERSTYLE_COLLECTION,
);

export async function getUserstyle(
  repo: ActorIdentifier,
  rkey: RecordKey,
): Promise<UserstyleRecord> {
  if (isAppviewEnabled()) {
    try {
      return await getUserstyleFromAppview(repo, rkey);
    } catch (err) {
      if (err instanceof ClientResponseError && err.error === 'UserstyleNotFound') throw err;
      console.warn('crayon appview unavailable, falling back to direct pds fetch', err);
    }
  }
  return await getUserstyleFromPds(repo, rkey);
}

/** Batched userstyle-by-uri lookup. */
export async function getUserstyles(
  uris: CanonicalResourceUri[],
): Promise<Map<CanonicalResourceUri, UserstyleRecord>> {
  const unique = [...new Set(uris)];
  if (unique.length === 0) return new Map();

  if (isAppviewEnabled()) {
    try {
      return await getUserstylesFromAppview(unique);
    } catch (err) {
      console.warn('crayon appview unavailable, falling back to per-uri lookups', err);
    }
  }

  const result = new Map<CanonicalResourceUri, UserstyleRecord>();
  await Promise.all(
    unique.map(async (uri) => {
      const { repo, rkey } = parseCanonicalResourceUri(uri);
      try {
        result.set(uri, await getUserstyle(repo, rkey));
      } catch {
        // Skipped: deleted/unresolvable userstyle。
      }
    }),
  );
  return result;
}

export async function getUserstyleSourceCode(userstyle: UserstyleRecord): Promise<string> {
  if (isAppviewEnabled()) {
    try {
      return await getUserstyleSourceCodeFromAppview(userstyle);
    } catch (err) {
      console.warn('crayon appview unavailable, falling back to direct pds fetch', err);
    }
  }
  return await getUserstyleSourceCodeFromPds(userstyle);
}

export function removeSourceCodeUpdateUrl(sourceCode: string): string {
  return sourceCode
    .split('\n')
    .filter((line) => !/^\s*@updateURL\s/.test(line))
    .join('\n');
}

export async function listUserstyles(repo: ActorIdentifier): Promise<UserstyleView[]> {
  if (isAppviewEnabled()) {
    try {
      return await listUserstylesFromAppview(repo);
    } catch (err) {
      console.warn('crayon appview unavailable, falling back to direct pds listing', err);
    }
  }
  return await listUserstylesFromPds(repo);
}

export async function listMyUserstyles() {
  const { did } = getSessionContext('You must be logged in to read your userstyles.');
  return await listUserstyles(did);
}

export async function createUserstyle(userstyle: UserstyleInput<{ previewImage?: File }>) {
  const previewImage = userstyle.previewImage
    ? await uploadBlob(userstyle.previewImage)
    : undefined;
  const sourceCode = await uploadBlob(new Blob([userstyle.sourceCode], { type: 'text/plain' }));
  return await createRecord(
    CLUB_USERSTYLE_COLLECTION,
    builder.create({ ...userstyle, previewImage, sourceCode }),
  );
}

export async function updateUserstyle(
  rkey: RecordKey,
  userstyle: UserstyleInput<{ previewImage?: File | Userstyle['previewImage']; createdAt: string }>,
) {
  const previewImage =
    userstyle.previewImage instanceof File
      ? await uploadBlob(userstyle.previewImage)
      : userstyle.previewImage;
  const sourceCode = await uploadBlob(new Blob([userstyle.sourceCode], { type: 'text/plain' }));

  return await putRecord(
    CLUB_USERSTYLE_COLLECTION,
    rkey,
    builder.update({ ...userstyle, previewImage, sourceCode }),
  );
}

export async function deleteUserstyle(rkey: RecordKey) {
  return await deleteRecord(CLUB_USERSTYLE_COLLECTION, rkey);
}

/**
 * Network-wide discovery feed (the /explore page).
 * Falls back to the relay-fanout path if the appview is off or unreachable.
 */
export async function listAllUserstyles(): Promise<UserstyleView[]> {
  if (isAppviewEnabled()) {
    try {
      return await listAllUserstylesFromAppview();
    } catch (err) {
      console.warn('crayon appview unavailable, falling back to relay-based discovery', err);
    }
  }
  return await listAllUserstylesFromRelay();
}

export type UserstyleFeedback = {
  commentThreadNodes: CommentThreadNode[];
  ratingSummary: { count: number; average: number | undefined };
};

export async function getUserstyleFeedback(
  userstyle: CanonicalResourceUri,
): Promise<UserstyleFeedback> {
  if (isAppviewEnabled()) {
    try {
      return await getFeedbackFromAppview(userstyle);
    } catch (err) {
      console.warn('crayon appview unavailable, falling back to constellation', err);
    }
  }
  return await getFeedbackFromConstellation(userstyle);
}
