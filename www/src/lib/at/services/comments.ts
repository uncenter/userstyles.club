import type { RecordKey, ResourceUri } from '@atcute/lexicons';
import { is } from '@atcute/lexicons/validations';

import {
  createRecord,
  deleteRecord,
  getBacklinkedRecords,
  putRecord,
  type RepoRecord,
} from '../records';

import { makeRecordBuilder, type RecordCreateInput, type RecordUpdateInput } from '../builder';
import { CLUB_COMMENT_COLLECTION } from '../settings';
import { ClubUserstylesAlphaGraphComment } from '$lib/at/lexicons';

export type Comment = ClubUserstylesAlphaGraphComment.Main;

export type CommentRecord = RepoRecord<Comment>;

export type CommentThread = {
  comment: CommentRecord;
  replies: CommentThread[];
};

const builder = makeRecordBuilder(
  ClubUserstylesAlphaGraphComment.mainSchema,
  CLUB_COMMENT_COLLECTION,
);

export async function listCommentsForStyle(uri: ResourceUri): Promise<CommentRecord[]> {
  const records = await getBacklinkedRecords(uri, CLUB_COMMENT_COLLECTION, 'subject');
  return records.filter((r): r is CommentRecord =>
    is(ClubUserstylesAlphaGraphComment.mainSchema, r.value),
  );
}

export function getCommentThreads(comments: CommentRecord[]): CommentThread[] {
  const nodes = new Map<ResourceUri, CommentThread>();

  for (const comment of comments) {
    nodes.set(comment.uri, {
      comment,
      replies: [],
    });
  }

  const roots: CommentThread[] = [];

  for (const comment of comments) {
    const node = nodes.get(comment.uri)!;

    if (comment.value.parent) {
      const parent = nodes.get(comment.value.parent);

      if (parent) {
        parent.replies.push(node);
      } else {
        // ignore orphaned replies
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function createComment(input: RecordCreateInput<Comment>) {
  return await createRecord(CLUB_COMMENT_COLLECTION, builder.create(input));
}

export async function updateComment(rkey: RecordKey, input: RecordUpdateInput<Comment>) {
  return await putRecord(CLUB_COMMENT_COLLECTION, rkey, builder.update(input));
}

export async function deleteComment(rkey: RecordKey) {
  return await deleteRecord(CLUB_COMMENT_COLLECTION, rkey);
}
