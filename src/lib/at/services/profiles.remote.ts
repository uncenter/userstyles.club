import { command } from '$app/server';

import { putRecord } from '$lib/server/records';
import { makeRecordBuilder, type RecordCreateInput } from '../builder';
import { CLUB_PROFILE_COLLECTION } from '../settings';
import { ClubUserstylesAlphaActorProfile } from '@userstyles.club/atcute';
import type { ClubProfile } from './profiles';

const builder = makeRecordBuilder(
  ClubUserstylesAlphaActorProfile.mainSchema,
  CLUB_PROFILE_COLLECTION,
);

const SELF_RKEY = 'self';

// Input is trusted as "unchecked" because `builder.build` already fully validates the record shape
// against the profile lexicon (throwing on anything invalid) before it's written.
export const setClubProfile = command(
  'unchecked',
  async ({
    input,
    existingCreatedAt,
  }: {
    input: RecordCreateInput<ClubProfile>;
    existingCreatedAt?: string;
  }) => {
    // No updatedAt, so we use build() instead of update() and generate the createdAt when necessary.
    const newProfile = builder.build({
      ...input,
      createdAt: existingCreatedAt ?? new Date().toISOString(),
    });

    return await putRecord(CLUB_PROFILE_COLLECTION, SELF_RKEY, newProfile);
  },
);
