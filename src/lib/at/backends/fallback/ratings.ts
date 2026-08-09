import { parseCanonicalResourceUri, type CanonicalResourceUri, type Did } from '@atcute/lexicons';
import { is } from '@atcute/lexicons/validations';

import { getBacklinkedRecords } from '../../records';
import { CLUB_RATING_COLLECTION } from '../../settings';
import { ClubUserstylesAlphaFeedRating } from '$lib/at/lexicons';
import type { RatingRecord } from '../../services/ratings';

/** A user may end up with multiple rating records for the same userstyle (an edit that changed rkey rather than updating in place).
 * Keeps the newest by TID (which are lexicographically sortable). */
export async function listRatingsFromConstellation(
  uri: CanonicalResourceUri,
  author?: Did,
): Promise<RatingRecord[]> {
  const records = await getBacklinkedRecords({
    subject: uri,
    collection: CLUB_RATING_COLLECTION,
    path: 'subject.uri',
    did: author ? [author] : undefined,
  });

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

export async function getRatingFromConstellation(
  uri: CanonicalResourceUri,
  author: Did,
): Promise<RatingRecord | undefined> {
  const ratings = await listRatingsFromConstellation(uri, author);
  return ratings[0];
}
