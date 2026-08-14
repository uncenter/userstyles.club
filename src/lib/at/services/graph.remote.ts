import { command } from '$app/server';
import type { Did, RecordKey } from '@atcute/lexicons';

import { createRecord, deleteRecord } from '$lib/server/records';
import { makeRecordBuilder } from '../builder';
import { CLUB_FOLLOW_COLLECTION } from '../settings';
import { ClubUserstylesAlphaGraphFollow } from '@userstyles.club/atcute';

const builder = makeRecordBuilder(
  ClubUserstylesAlphaGraphFollow.mainSchema,
  CLUB_FOLLOW_COLLECTION,
);

export const followActor = command('unchecked', async (subject: Did) => {
  return await createRecord(CLUB_FOLLOW_COLLECTION, builder.create({ subject }));
});

export const unfollowActor = command('unchecked', async (rkey: RecordKey) => {
  return await deleteRecord(CLUB_FOLLOW_COLLECTION, rkey);
});
