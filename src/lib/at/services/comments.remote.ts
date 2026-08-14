import { command } from '$app/server';
import type { RecordKey } from '@atcute/lexicons';

import { createRecord, deleteRecord, putRecord } from '$lib/server/records';
import { makeRecordBuilder, type RecordCreateInput, type RecordUpdateInput } from '../builder';
import { CLUB_COMMENT_COLLECTION } from '../settings';
import { ClubUserstylesAlphaFeedComment } from '@userstyles.club/atcute';
import type { Comment } from './comments';

const builder = makeRecordBuilder(
  ClubUserstylesAlphaFeedComment.mainSchema,
  CLUB_COMMENT_COLLECTION,
);

// Input is trusted as "unchecked" because `builder.create`/`builder.update` already fully validate
// the record shape against the comment lexicon (throwing on anything invalid) before it's written.
export const createComment = command('unchecked', async (input: RecordCreateInput<Comment>) => {
  return await createRecord(CLUB_COMMENT_COLLECTION, builder.create(input));
});

export const updateComment = command(
  'unchecked',
  async ({ rkey, input }: { rkey: RecordKey; input: RecordUpdateInput<Comment> }) => {
    return await putRecord(CLUB_COMMENT_COLLECTION, rkey, builder.update(input));
  },
);

export const deleteComment = command('unchecked', async (rkey: RecordKey) => {
  return await deleteRecord(CLUB_COMMENT_COLLECTION, rkey);
});
