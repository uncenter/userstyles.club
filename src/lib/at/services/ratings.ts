import type { CanonicalResourceUri, Did, RecordKey } from '@atcute/lexicons';
import { createRecord, deleteRecord, putRecord, type RepoRecord } from '../records';

import { getRatingFromAppview, listRatingsFromAppview } from '../backends/appview/ratings';
import { getRatingFromConstellation, listRatingsFromConstellation } from '../backends/fallback/ratings';

import { makeRecordBuilder, type RecordCreateInput, type RecordUpdateInput } from '../builder';
import { CLUB_RATING_COLLECTION, isAppviewEnabled } from '../settings';
import { ClubUserstylesAlphaFeedRating } from '$lib/at/lexicons';

export type Rating = ClubUserstylesAlphaFeedRating.Main;

export type RatingRecord = RepoRecord<Rating>;

const builder = makeRecordBuilder(ClubUserstylesAlphaFeedRating.mainSchema, CLUB_RATING_COLLECTION);

export async function listRatingsForStyle(uri: CanonicalResourceUri): Promise<RatingRecord[]> {
  if (isAppviewEnabled()) {
    try {
      return await listRatingsFromAppview(uri);
    } catch (err) {
      console.warn('crayon appview unavailable, falling back to constellation', err);
    }
  }
  return await listRatingsFromConstellation(uri);
}

/** A single rater's current rating on a subject. */
export async function getUserRatingForStyle(
  uri: CanonicalResourceUri,
  author: Did,
): Promise<RatingRecord | undefined> {
  if (isAppviewEnabled()) {
    try {
      return await getRatingFromAppview(uri, author);
    } catch (err) {
      console.warn('crayon appview unavailable, falling back to constellation', err);
    }
  }
  return await getRatingFromConstellation(uri, author);
}

export async function createRating(input: RecordCreateInput<Rating>) {
  return await createRecord(CLUB_RATING_COLLECTION, builder.create(input));
}

export async function updateRating(rkey: RecordKey, input: RecordUpdateInput<Rating>) {
  return await putRecord(CLUB_RATING_COLLECTION, rkey, builder.update(input));
}

export async function deleteRating(rkey: RecordKey): Promise<boolean> {
  return await deleteRecord(CLUB_RATING_COLLECTION, rkey);
}

export function computeRatingSummary(
  ratings: RatingRecord[],
): { average: number | undefined; count: number } {
  if (ratings.length === 0) return { average: undefined, count: 0 };
  return {
    average: ratings.reduce((sum, r) => sum + r.value.rating, 0) / ratings.length,
    count: ratings.length,
  };
}
