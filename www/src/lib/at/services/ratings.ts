import { createRecord, deleteRecord, getBacklinksFrom, getRecord, putRecord, resolveBacklinkedRecords, type RecordCommit } from '../records';

import { l, type AtIdentifierString, type AtUriString, type RecordKeyString } from '@atproto/lex';
import * as club from '../generated/club';

export type Rating = club.userstyles.alpha.graph.rating.Main;
export type RatingRecord = RecordCommit<club.userstyles.alpha.graph.rating.Main>;

export async function listRatingsForStyle(uri: AtUriString) {
  const backlinks = await getBacklinksFrom(club.userstyles.alpha.graph.rating, uri, 'subject');
  return await resolveBacklinkedRecords(club.userstyles.alpha.graph.rating, backlinks);
}

export async function createRating({ subject, rating }: Omit<club.userstyles.alpha.graph.rating.Main, "$type" | 'createdAt'>) {
  return await createRecord(club.userstyles.alpha.graph.rating, club.userstyles.alpha.graph.rating.$parse({
    subject,
    rating,
    createdAt: l.currentDatetimeString()
  }));
}

export async function getRating(repo: AtIdentifierString, rkey: RecordKeyString) {
  return await getRecord(club.userstyles.alpha.graph.rating, {
    repo,
    rkey,
  });
}

export async function updateRating(rkey: RecordKeyString, { subject, rating, createdAt }: Omit<club.userstyles.alpha.graph.rating.Main, "$type">) {
  return await putRecord(club.userstyles.alpha.graph.rating, club.userstyles.alpha.graph.rating.$parse({
    subject,
    rating,
    createdAt,
    updatedAt: l.currentDatetimeString()
  }), {
    rkey
  });
}

export async function deleteRating(rkey: RecordKeyString) {
  return await deleteRecord(club.userstyles.alpha.graph.rating, { rkey });
}

export function computeAverageRating(
  ratings: RatingRecord[],
): { average: number; count: number } | undefined {
  if (ratings.length === 0) return undefined;
  return {
    average: ratings.reduce((sum, r) => sum + r.value.rating, 0) / ratings.length,
    count: ratings.length,
  };
}
