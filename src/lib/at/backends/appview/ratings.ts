import { ok } from '@atcute/client';
import type { CanonicalResourceUri, Did } from '@atcute/lexicons';

import { getCrayonClient } from '../../client';
import { CLUB_RATING_COLLECTION } from '../../settings';
import type { ClubUserstylesAlphaDefs } from '$lib/at/lexicons';
import type { Rating, RatingRecord } from '../../services/ratings';

/** The `subject.cid` field is a placeholder, as Crayon only carries `subjectUri`.
 * Nothing downstream reads a rating's `.value.subject.cid`. */
export function ratingViewToRecord(view: ClubUserstylesAlphaDefs.RatingView): RatingRecord {
  const value: Rating = {
    $type: CLUB_RATING_COLLECTION,
    subject: { uri: view.subjectUri, cid: '' },
    rating: view.rating,
    createdAt: view.createdAt,
    updatedAt: view.updatedAt,
  };
  return { uri: view.uri as CanonicalResourceUri, cid: view.cid, value };
}

export async function listRatingsFromAppview(uri: CanonicalResourceUri): Promise<RatingRecord[]> {
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.feed.listRatings', {
      params: { subject: uri, limit: 100 },
    }),
  );
  return response.ratings.map(ratingViewToRecord);
}

/** A single rater's current rating on a subject. */
export async function getRatingFromAppview(
  uri: CanonicalResourceUri,
  author: Did,
): Promise<RatingRecord | undefined> {
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.feed.listRatings', {
      params: { subject: uri, author, limit: 1 },
    }),
  );
  return response.ratings[0] ? ratingViewToRecord(response.ratings[0]) : undefined;
}
