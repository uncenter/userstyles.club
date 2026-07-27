import {
  parseCanonicalResourceUri,
  type CanonicalResourceUri,
  type RecordKey,
} from '@atcute/lexicons';
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

export async function listRatingsForStyle(uri: CanonicalResourceUri): Promise<RatingRecord[]> {
  const records = await getBacklinkedRecords(uri, CLUB_RATING_COLLECTION, 'subject.uri');

  // A user may end up with multiple rating records for the same userstyle.
  // In this case, we keep the newest (by TID, which are lexicographically sortable).
  const newestByAuthor = new Map<string, RatingRecord>();
  for (const record of records) {
    if (!is(ClubUserstylesAlphaFeedRating.mainSchema, record.value)) continue;
    const rating = record as RatingRecord;

    const { repo, rkey } = parseCanonicalResourceUri(rating.uri);
    const existing = newestByAuthor.get(repo);
    if (!existing || rkey > parseCanonicalResourceUri(existing.uri).rkey) {
      newestByAuthor.set(repo, rating);
    }
  }

  return [...newestByAuthor.values()];
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
