import type { CanonicalResourceUri, Did } from '@atcute/lexicons';
import type { RepoRecord } from '../records';

import { getRatingFromAppview, listRatingsFromAppview } from '../backends/appview/ratings';
import {
  getRatingFromConstellation,
  listRatingsFromConstellation,
} from '../backends/fallback/ratings';

import { isAppviewEnabled } from '../settings';
import { ClubUserstylesAlphaFeedRating } from '@userstyles.club/atcute';

export type Rating = ClubUserstylesAlphaFeedRating.Main;

export type RatingRecord = RepoRecord<Rating>;

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

export function computeRatingSummary(ratings: RatingRecord[]): {
  average: number | undefined;
  count: number;
} {
  if (ratings.length === 0) return { average: undefined, count: 0 };
  return {
    average: ratings.reduce((sum, r) => sum + r.value.rating, 0) / ratings.length,
    count: ratings.length,
  };
}
