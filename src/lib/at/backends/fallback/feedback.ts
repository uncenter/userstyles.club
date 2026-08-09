import { parseCanonicalResourceUri, type CanonicalResourceUri } from '@atcute/lexicons';

import { getCommentThreadsFromConstellation } from './comments';
import { listRatingsFromConstellation } from './ratings';
import { computeRatingSummary } from '../../services/ratings';
import type { UserstyleFeedback } from '../../services/userstyles';

export async function getFeedbackFromConstellation(
  userstyle: CanonicalResourceUri,
): Promise<UserstyleFeedback> {
  const [nodes, ratings] = await Promise.all([
    getCommentThreadsFromConstellation(userstyle),
    listRatingsFromConstellation(userstyle),
  ]);

  const ratingsByAuthor = new Map(ratings.map((r) => [parseCanonicalResourceUri(r.uri).repo, r]));

  const commentThreadNodes = nodes.map((node) => {
    if (node.deleted || node.parentUri) return node;
    const rating = ratingsByAuthor.get(parseCanonicalResourceUri(node.uri).repo);
    return rating ? { ...node, rating: rating.value.rating } : node;
  });

  return { commentThreadNodes, ratingSummary: computeRatingSummary(ratings) };
}
