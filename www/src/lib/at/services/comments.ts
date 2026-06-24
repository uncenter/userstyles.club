import { createRecord, deleteRecord, getBacklinksFrom, getRecord, putRecord, resolveBacklinkedRecords, type RecordCommit } from '../records';

import { l, type AtIdentifierString, type AtUriString, type RecordKeyString } from '@atproto/lex';
import * as club from '../generated/club';

export type Comment = club.userstyles.alpha.graph.comment.Main;
export type CommentRecord = RecordCommit<club.userstyles.alpha.graph.comment.Main>;

export type CommentThread = {
  comment: CommentRecord;
  replies: CommentThread[];
};

export async function listCommentsForStyle(uri: AtUriString): Promise<CommentRecord[]> {
  const backlinks = await getBacklinksFrom(club.userstyles.alpha.graph.comment, uri, 'subject');
  return await resolveBacklinkedRecords(club.userstyles.alpha.graph.comment, backlinks);
}

export function getCommentThreads(comments: CommentRecord[]): CommentThread[] {
  const nodes = new Map<AtUriString, CommentThread>();

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

export async function createComment({ subject, parent, comment }: Omit<club.userstyles.alpha.graph.comment.Main, "$type" | 'createdAt' | 'updatedAt'>) {
  return await createRecord(club.userstyles.alpha.graph.comment, club.userstyles.alpha.graph.comment.$parse({
    subject,
    parent,
    comment,
    createdAt: l.currentDatetimeString()
  }));
}

export async function getComment(repo: AtIdentifierString, rkey: RecordKeyString) {
  return await getRecord(club.userstyles.alpha.graph.comment, {
    repo,
    rkey,
  });
}

export async function updateComment(rkey: RecordKeyString, { subject, parent, comment, createdAt }: Omit<club.userstyles.alpha.graph.comment.Main, "$type" | 'updatedAt'>) {
  return await putRecord(club.userstyles.alpha.graph.comment, club.userstyles.alpha.graph.comment.$parse({
    subject,
    parent,
    comment,
    createdAt,
    updatedAt: l.currentDatetimeString()
  }), {
    rkey
  });
}

export async function deleteComment(rkey: RecordKeyString) {
  return await deleteRecord(club.userstyles.alpha.graph.comment, { rkey });
}

