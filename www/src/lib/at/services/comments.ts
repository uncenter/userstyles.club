import type { RecordKey, ResourceUri } from '@atcute/lexicons';
import { createRecord, deleteRecord, getBacklinksTo, putRecord, resolveBacklinkedRecords, type RepoRecord } from '../records';
import { CLUB_COMMENT_COLLECTION } from '../settings';

export type Comment = {
  userstyle: ResourceUri;
  parent?: ResourceUri;
  comment: string;
  createdAt: string;
  updatedAt?: string;
};

export type CommentRecord = RepoRecord & {
  value: Comment;
};

export type CommentThread = {
  comment: CommentRecord;
  replies: CommentThread[];
};

export function isComment(value: Record<string, unknown>): value is Comment {
  return (
    typeof value.userstyle === 'string' &&
    typeof value.comment === 'string' &&
    typeof value.createdAt === 'string'
  );
}

export async function listCommentsForStyle(uri: ResourceUri): Promise<CommentRecord[]> {
  const backlinks = await getBacklinksTo(uri, CLUB_COMMENT_COLLECTION, 'userstyle');
  const records = await resolveBacklinkedRecords(backlinks);

  return records.filter((r): r is CommentRecord => r !== null && isComment(r.value));
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

export async function createComment(userstyle: ResourceUri, comment: string, parent?: ResourceUri) {
  comment = comment.trim();
  if (!comment) throw new Error('Comment is required.');

  return createRecord(CLUB_COMMENT_COLLECTION, {
    $type: CLUB_COMMENT_COLLECTION,
    userstyle,
    ...(parent !== undefined && { parent }),
    comment,
    createdAt: new Date().toISOString(),
  });
}

export async function updateComment(
  rkey: RecordKey,
  userstyle: ResourceUri,
  comment: string,
  createdAt: string,
  parent?: ResourceUri,
) {
  comment = comment.trim();
  if (!comment) throw new Error('Comment is required.');

  return putRecord(CLUB_COMMENT_COLLECTION, rkey, {
    $type: CLUB_COMMENT_COLLECTION,
    userstyle,
    ...(parent !== undefined && { parent }),
    comment,
    createdAt,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteComment(rkey: RecordKey) {
  return deleteRecord(CLUB_COMMENT_COLLECTION, rkey);
}
