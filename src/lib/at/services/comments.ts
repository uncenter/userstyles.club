import {
  type CanonicalResourceUri,
  type Did,
  type RecordKey,
  parseCanonicalResourceUri,
} from '@atcute/lexicons';

import { createRecord, deleteRecord, putRecord, type RepoRecord } from '../records';

import {
  listCommentsFromAppview,
  listCommentsByAuthorFromAppview,
  countCommentsByAuthorFromAppview,
} from '../backends/appview/comments';
import {
  listCommentsFromConstellation,
  listCommentsByAuthorFromPds,
} from '../backends/fallback/comments';

import { makeRecordBuilder, type RecordCreateInput, type RecordUpdateInput } from '../builder';
import { CLUB_COMMENT_COLLECTION, isAppviewEnabled } from '../settings';
import { ClubUserstylesAlphaFeedComment } from '@userstyles.club/atcute';

export type Comment = ClubUserstylesAlphaFeedComment.Main;

export type CommentRecord = RepoRecord<Comment>;

/** A node in a userstyle's comment tree.
 * `comment` is present if `!deleted`, as a deleted node keeps only its `uri` (so replies still have somewhere to attach) and `replies`.
 * Deleted nodes are tombstoned by the appview, but not discoverable when relying on the constellation fallback.
 * `rating` is set only on a top-level (root) node whose author has a current rating on the subject. */
export type CommentThread = {
  uri: CanonicalResourceUri;
  deleted: boolean;
  comment?: CommentRecord;
  rating?: number;
  replies: CommentThread[];
};

export type CommentThreads = {
  threads: CommentThread[];
  /** Total non-deleted comments across the whole tree.  */
  count: number;
};

export type CommentThreadNode = {
  uri: CanonicalResourceUri;
  parentUri: CanonicalResourceUri | undefined;
  deleted: boolean;
  comment: CommentRecord | undefined;
  rating?: number;
};

/** Every non-deleted commenter's did across a thread tree, for batch-fetching profiles once instead of per node. */
export function collectThreadAuthorDids(threads: CommentThread[]): Did[] {
  const dids: Did[] = [];
  const walk = (nodes: CommentThread[]) => {
    for (const node of nodes) {
      if (!node.deleted) dids.push(parseCanonicalResourceUri(node.uri).repo);
      walk(node.replies);
    }
  };
  walk(threads);
  return dids;
}

/** Shared flat-list-to-tree nesting, used by both the appview and fallback backends. */
export function buildCommentThreads(nodes: CommentThreadNode[]): CommentThreads {
  const byUri = new Map<CanonicalResourceUri, CommentThread>();
  let count = 0;
  for (const node of nodes) {
    if (!node.deleted) count++;
    byUri.set(node.uri, {
      uri: node.uri,
      deleted: node.deleted,
      comment: node.comment,
      rating: node.rating,
      replies: [],
    });
  }

  const threads: CommentThread[] = [];
  for (const node of nodes) {
    const thread = byUri.get(node.uri)!;
    if (!node.parentUri) {
      threads.push(thread);
      continue;
    }
    byUri.get(node.parentUri)?.replies.push(thread);
  }

  return { threads, count };
}

export type CommentThreadPatch = Partial<CommentThreadNode>;

/** Folds locally-pending add/edit/delete patches (keyed by uri) over a confirmed flat comment list, for building an optimistic view ahead of the next reload.
 * A patch for a uri not present in `confirmed` is an optimistic add. */
export function applyCommentPatches(
  confirmed: CommentThreadNode[],
  patches: Record<string, CommentThreadPatch>,
): CommentThreadNode[] {
  const byUri = new Map(confirmed.map((node) => [node.uri, node]));
  for (const uri in patches) {
    byUri.set(
      uri as CanonicalResourceUri,
      { ...byUri.get(uri as CanonicalResourceUri), ...patches[uri] } as CommentThreadNode,
    );
  }
  return [...byUri.values()];
}

const builder = makeRecordBuilder(
  ClubUserstylesAlphaFeedComment.mainSchema,
  CLUB_COMMENT_COLLECTION,
);

export async function listCommentsForStyle(uri: CanonicalResourceUri): Promise<CommentRecord[]> {
  if (isAppviewEnabled()) {
    try {
      return await listCommentsFromAppview(uri);
    } catch (err) {
      console.warn('crayon appview unavailable, falling back to constellation', err);
    }
  }
  return await listCommentsFromConstellation(uri);
}

/** A given author's comments across every subject, newest first. */
export async function listCommentsByAuthor(
  author: Did,
  opts: { cursor?: string; limit?: number } = {},
){
  if (isAppviewEnabled()) {
    try {
      return await listCommentsByAuthorFromAppview(author, opts);
    } catch (err) {
      console.warn('crayon appview unavailable, falling back to direct pds listing', err);
    }
  }
  return await listCommentsByAuthorFromPds(author, opts);
}

/** Total comment count for a given author. */
export async function countCommentsByAuthor(author: Did): Promise<number> {
  if (!isAppviewEnabled()) throw new Error('Comment counts require the appview to be enabled.');
  return await countCommentsByAuthorFromAppview(author);
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
