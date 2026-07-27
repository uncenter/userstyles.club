import type { RecordKey, ResourceUri } from '@atcute/lexicons';
import { is } from '@atcute/lexicons/validations';
import {
  createRecord,
  deleteRecord,
  getBacklinkedRecords,
  putRecord,
  type RepoRecord,
} from '../records';

import { makeRecordBuilder, type RecordCreateInput, type RecordUpdateInput } from '../builder';
import { CLUB_RATING_COLLECTION } from '../settings';
import { ClubUserstylesAlphaFeedRating } from '$lib/at/lexicons';

export type Rating = ClubUserstylesAlphaFeedRating.Main;

export type RatingRecord = RepoRecord<Rating>;

const builder = makeRecordBuilder(ClubUserstylesAlphaFeedRating.mainSchema, CLUB_RATING_COLLECTION);

export async function listRatingsForStyle(uri: ResourceUri): Promise<RatingRecord[]> {
  const records = await getBacklinkedRecords(uri, CLUB_RATING_COLLECTION, 'subject.uri');
  return records.filter((r): r is RatingRecord =>
    is(ClubUserstylesAlphaFeedRating.mainSchema, r.value),
  );
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

export function computeAverageRating(
  ratings: RatingRecord[],
): { average: number; count: number } | undefined {
  if (ratings.length === 0) return undefined;
  return {
    average: ratings.reduce((sum, r) => sum + r.value.rating, 0) / ratings.length,
    count: ratings.length,
  };
}
