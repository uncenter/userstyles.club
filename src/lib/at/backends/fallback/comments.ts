import type { CanonicalResourceUri, Did } from '@atcute/lexicons';
import { is } from '@atcute/lexicons/validations';

import { getBacklinkedRecords, listRecordsForRepo } from '../../records';
import { CLUB_COMMENT_COLLECTION } from '../../settings';
import { ClubUserstylesAlphaFeedComment } from '@userstyles.club/atcute';
import type { CommentRecord, CommentThreadNode } from '../../services/comments';

export async function listCommentsFromConstellation(
  uri: CanonicalResourceUri,
): Promise<CommentRecord[]> {
  const records = await getBacklinkedRecords({
    subject: uri,
    collection: CLUB_COMMENT_COLLECTION,
    path: 'subject.uri',
  });
  return records.filter((r): r is CommentRecord =>
    is(ClubUserstylesAlphaFeedComment.mainSchema, r.value),
  );
}

export async function listCommentsByAuthorFromPds(
  author: Did,
  opts: { cursor?: string; limit?: number } = {},
) {
  const response = await listRecordsForRepo({
    repo: author,
    collection: CLUB_COMMENT_COLLECTION,
    limit: opts.limit,
    cursor: opts.cursor,
    reverse: true,
  });
  const comments = response.records.filter((r): r is CommentRecord =>
    is(ClubUserstylesAlphaFeedComment.mainSchema, r.value),
  );
  return { comments, cursor: response.cursor };
}

/** Backlinks have no concept of a tombstone, so a reply whose parent was deleted is dropped.
 * With the primary getFeedbackFromAppview, every reply's place is kept with even a tombstoned parent. */
export async function getCommentThreadsFromConstellation(
  uri: CanonicalResourceUri,
): Promise<CommentThreadNode[]> {
  const comments = await listCommentsFromConstellation(uri);

  return comments.map((comment) => ({
    uri: comment.uri,
    parentUri: comment.value.parent?.uri as CanonicalResourceUri | undefined,
    deleted: false,
    comment,
  }));
}
