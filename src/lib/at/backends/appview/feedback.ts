import { ok } from '@atcute/client';
import type { CanonicalResourceUri } from '@atcute/lexicons';

import { getCrayonClient } from '../../client';
import { CLUB_COMMENT_COLLECTION } from '../../settings';
import type { ClubUserstylesAlphaDefs } from '$lib/at/lexicons';
import type { Comment, CommentRecord, CommentThreadNode } from '../../services/comments';
import type { UserstyleFeedback } from '../../services/userstyles';

/** The `subject`/`parent` `.cid` fields are placeholders: Crayon's comment views only carry `subjectUri`/`parentUri`.
 * Nothing downstream reads a comment's `.value.subject.cid` or `.value.parent.cid`. */
function commentThreadRowToRecord(
  row: ClubUserstylesAlphaDefs.CommentThreadView,
): CommentRecord | undefined {
  if (row.deleted) return undefined;
  const value: Comment = {
    $type: CLUB_COMMENT_COLLECTION,
    subject: { uri: row.subjectUri!, cid: '' },
    parent: row.parentUri ? { uri: row.parentUri, cid: '' } : undefined,
    comment: row.comment!,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
  return { uri: row.uri as CanonicalResourceUri, cid: row.cid, value };
}

/** The appview tombstones deleted comments rather than dropping them, so replies to a deleted comment keep their place in the tree instead of becoming "orphaned". */
export async function getFeedbackFromAppview(uri: CanonicalResourceUri): Promise<UserstyleFeedback> {
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.feed.getFeedback', { params: { subject: uri } }),
  );

  const commentThreadNodes: CommentThreadNode[] = response.comments.map((row) => ({
    uri: row.uri as CanonicalResourceUri,
    parentUri: row.parentUri as CanonicalResourceUri | undefined,
    deleted: row.deleted,
    comment: commentThreadRowToRecord(row),
    rating: row.rating,
  }));

  return {
    commentThreadNodes,
    ratingSummary: {
      count: response.ratingCount,
      average: response.ratingAverage !== undefined ? Number(response.ratingAverage) : undefined,
    },
  };
}
