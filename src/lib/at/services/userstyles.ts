import {
  getUserstyleFromAppview,
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
import type { RepoRecord } from '../records';

import type { CommentThreadNode } from './comments';

import { ClientResponseError } from '@atcute/client';
import { type ActorIdentifier, type RecordKey, type CanonicalResourceUri } from '@atcute/lexicons';

import { isAppviewEnabled } from '../settings';
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

/**
 * Appview-computed fields for a userstyle.
 */
export type UserstyleDetailExtras = {
  mozDocumentFunctions: ClubUserstylesAlphaDefs.MozDocumentFunction[];
  userCssVars?: number;
  ratingCount?: number;
  ratingAverage?: number;
  commentCount?: number;
};

export type UserstyleRecord = RepoRecord<Userstyle> & { extras?: UserstyleDetailExtras };

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

/** Converts a `File` into the wire shape a remote command can carry (see `services/userstyles.remote.ts`). */
export async function blobInputFromFile(file: File): Promise<{ bytes: Uint8Array; type: string }> {
  return { bytes: new Uint8Array(await file.arrayBuffer()), type: file.type };
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
