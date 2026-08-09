import { ok } from '@atcute/client';
import type { CanonicalResourceUri } from '@atcute/lexicons';

import { getCrayonClient } from '../../client';
import { CLUB_COMMENT_COLLECTION } from '../../settings';
import type { ClubUserstylesAlphaDefs } from '$lib/at/lexicons';
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
