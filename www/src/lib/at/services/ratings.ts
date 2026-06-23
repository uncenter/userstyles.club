import type { RecordKey, ResourceUri } from '@atcute/lexicons';
import { createRecord, deleteRecord, getBacklinksTo, putRecord, resolveBacklinkedRecords, type RepoRecord } from '../records';
import { CLUB_RATING_COLLECTION } from '../settings';

export type Rating = {
  userstyle: ResourceUri;
  rating: number;
  createdAt: string;
  updatedAt?: string;
};

export type RatingRecord = RepoRecord & {
  value: Rating;
};

export function isRating(value: Record<string, unknown>): value is Rating {
  return (
    typeof value.userstyle === 'string' &&
    typeof value.rating === 'number' &&
    typeof value.createdAt === 'string'
  );
}

export async function listRatingsForStyle(uri: ResourceUri): Promise<RatingRecord[]> {
  const backlinks = await getBacklinksTo(uri, CLUB_RATING_COLLECTION, 'userstyle');
  const records = await resolveBacklinkedRecords(backlinks);

  return records.filter((r): r is RatingRecord => r !== null && isRating(r.value));
}

export async function createRating(userstyle: ResourceUri, rating: number) {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5.');
  }

  return createRecord(CLUB_RATING_COLLECTION, {
    $type: CLUB_RATING_COLLECTION,
    userstyle,
    rating,
    createdAt: new Date().toISOString(),
  });
}

export async function updateRating(
  rkey: RecordKey,
  userstyle: ResourceUri,
  rating: number,
  createdAt: string,
) {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5.');
  }

  return putRecord(CLUB_RATING_COLLECTION, rkey, {
    $type: CLUB_RATING_COLLECTION,
    userstyle,
    rating,
    createdAt,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteRating(rkey: RecordKey) {
  return deleteRecord(CLUB_RATING_COLLECTION, rkey);
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
