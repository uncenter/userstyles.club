import { command } from '$app/server';
import type { RecordKey } from '@atcute/lexicons';

import { createRecord, deleteRecord, putRecord } from '$lib/server/records';
import { makeRecordBuilder, type RecordCreateInput, type RecordUpdateInput } from '../builder';
import { CLUB_RATING_COLLECTION } from '../settings';
import { ClubUserstylesAlphaFeedRating } from '@userstyles.club/atcute';
import type { Rating } from './ratings';

const builder = makeRecordBuilder(ClubUserstylesAlphaFeedRating.mainSchema, CLUB_RATING_COLLECTION);

// Input is trusted as "unchecked" because `builder.create`/`builder.update` already fully validate
// the record shape against the rating lexicon (throwing on anything invalid) before it's written.
export const createRating = command('unchecked', async (input: RecordCreateInput<Rating>) => {
  return await createRecord(CLUB_RATING_COLLECTION, builder.create(input));
});

export const updateRating = command(
  'unchecked',
  async ({ rkey, input }: { rkey: RecordKey; input: RecordUpdateInput<Rating> }) => {
    return await putRecord(CLUB_RATING_COLLECTION, rkey, builder.update(input));
  },
);

export const deleteRating = command('unchecked', async (rkey: RecordKey) => {
  return await deleteRecord(CLUB_RATING_COLLECTION, rkey);
});
