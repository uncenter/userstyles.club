import { ok } from '@atcute/client';
import type { CanonicalResourceUri, Did } from '@atcute/lexicons';

import { getCrayonClient } from '../../client';
import { CLUB_COMMENT_COLLECTION } from '../../settings';
import type { ClubUserstylesAlphaDefs } from '@userstyles.club/atcute';
import type { Comment, CommentRecord } from '../../services/comments';

/** The `subject`/`parent` `.cid` fields are placeholders: Crayon's comment views only carry `subjectUri`/`parentUri`.
 * Nothing downstream reads a comment's `.value.subject.cid` or `.value.parent.cid`. */
function commentViewToRecord(view: ClubUserstylesAlphaDefs.CommentView): CommentRecord {
  const value: Comment = {
    $type: CLUB_COMMENT_COLLECTION,
    subject: { uri: view.subjectUri, cid: '' },
    parent: view.parentUri ? { uri: view.parentUri, cid: '' } : undefined,
    comment: view.comment,
    createdAt: view.createdAt,
    updatedAt: view.updatedAt,
  };
  return { uri: view.uri as CanonicalResourceUri, cid: view.cid, value };
}

export async function listCommentsFromAppview(uri: CanonicalResourceUri): Promise<CommentRecord[]> {
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.feed.listComments', {
      params: { subject: uri, limit: 100 },
    }),
  );
  return response.comments.map(commentViewToRecord);
}

export async function listCommentsByAuthorFromAppview(
  author: Did,
  opts: { cursor?: string; limit?: number } = {},
) {
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.feed.listComments', {
      params: { author, hydrate: ['userstyle'], limit: opts.limit ?? 50, cursor: opts.cursor },
    }),
  );
  return { comments: response.comments.map(commentViewToRecord), cursor: response.cursor };
}

export async function countCommentsByAuthorFromAppview(author: Did): Promise<number> {
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.feed.countComments', { params: { author } }),
  );
  return response.count;
}
