import type { ActorIdentifier, RecordKey, ResourceUri } from '@atcute/lexicons';
import { parseResourceUri } from '@atcute/lexicons/syntax';
import { ok } from '@atcute/client';
import { getConstellationClient } from '../client';
import { createRecord, deleteRecord, getRecord, putRecord, type RepoRecord } from '../records';
import { CLUB_REVIEW_COLLECTION } from '../settings';

export type Review = {
  subject: ResourceUri;
  rating?: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
};

export function getReviewRkey(uri: string): RecordKey {
  return parseResourceUri(uri).rkey!;
}

export function getReviewAuthorDid(uri: string): ActorIdentifier {
  return parseResourceUri(uri).repo!;
}

export type ReviewRecord = RepoRecord & {
  value: Review;
};

function isReview(value: Record<string, unknown>): value is Review {
  return (
    typeof value.subject === 'string' &&
    typeof value.comment === 'string' &&
    typeof value.createdAt === 'string'
  );
}

export async function listReviewsForStyle(uri: ResourceUri): Promise<ReviewRecord[]> {
  const client = getConstellationClient();

  const response = await ok(
    client.get('blue.microcosm.links.getBacklinks', {
      params: {
        subject: uri,
        source: `${CLUB_REVIEW_COLLECTION}:subject`,
        limit: 100
      }
    })
  );

  const records = await Promise.all(
    response.records.map(async ({ did, rkey }) => {
      try {
        return (await getRecord({
          repo: did,
          collection: CLUB_REVIEW_COLLECTION,
          rkey
        })) as ReviewRecord;
      } catch {
        return null;
      }
    })
  );

  return records.filter((r): r is ReviewRecord => r !== null && isReview(r.value));
}

export async function createReview(subject: ResourceUri, comment: string, rating?: number) {
  comment = comment.trim();
  if (!comment) throw new Error('Review comment is required.');
  if (rating !== undefined && (rating < 1 || rating > 5)) {
    throw new Error('Rating must be between 1 and 5.');
  }

  return createRecord(CLUB_REVIEW_COLLECTION, {
    $type: CLUB_REVIEW_COLLECTION,
    subject,
    ...(rating !== undefined && { rating }),
    comment,
    createdAt: new Date().toISOString()
  });
}

export async function updateReview(
  rkey: RecordKey,
  subject: ResourceUri,
  comment: string,
  createdAt: string,
  rating?: number
) {
  comment = comment.trim();
  if (!comment) throw new Error('Review comment is required.');
  if (rating !== undefined && (rating < 1 || rating > 5)) {
    throw new Error('Rating must be between 1 and 5.');
  }

  return putRecord(CLUB_REVIEW_COLLECTION, rkey, {
    $type: CLUB_REVIEW_COLLECTION,
    subject,
    ...(rating !== undefined && { rating }),
    comment,
    createdAt,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteReview(rkey: RecordKey) {
  return deleteRecord(CLUB_REVIEW_COLLECTION, rkey);
}

export function computeAverageRating(
  reviews: ReviewRecord[]
): { average: number; count: number } | undefined {
  const rated = reviews.filter(
    (r): r is ReviewRecord & { value: Review & { rating: number } } => r.value.rating !== undefined
  );
  if (rated.length === 0) return undefined;
  return {
    average: rated.reduce((sum, r) => sum + r.value.rating, 0) / rated.length,
    count: rated.length
  };
}
