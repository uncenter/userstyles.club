import { command } from '$app/server';
import type { RecordKey } from '@atcute/lexicons';

import { createRecord, deleteRecord, putRecord, uploadBlob } from '$lib/server/records';
import { makeRecordBuilder } from '../builder';
import { CLUB_USERSTYLE_COLLECTION } from '../settings';
import { ClubUserstylesAlphaUserstyle } from '@userstyles.club/atcute';
import type { Userstyle, UserstyleContent } from './userstyles';

const builder = makeRecordBuilder(
  ClubUserstylesAlphaUserstyle.mainSchema,
  CLUB_USERSTYLE_COLLECTION,
);

/** A file's bytes, carried over the wire to a remote command - commands can't take a `File`/`Blob`
 * directly (that needs `form()`), but devalue serializes `Uint8Array` natively. See
 * `blobInputFromFile` in `./userstyles.ts` for the client-side conversion. */
export type BlobInput = { bytes: Uint8Array; type: string };

async function resolvePreviewImage(
  previewImage: BlobInput | Userstyle['previewImage'] | undefined,
) {
  if (previewImage && 'bytes' in previewImage) {
    return await uploadBlob(
      new Blob([new Uint8Array(previewImage.bytes)], { type: previewImage.type }),
    );
  }
  return previewImage;
}

// Input is trusted as "unchecked" because `builder.create`/`builder.update` already fully validate
// the record shape against the userstyle lexicon (throwing on anything invalid) before it's written.
export const createUserstyle = command(
  'unchecked',
  async (userstyle: UserstyleContent & { previewImage?: BlobInput }) => {
    const previewImage = await resolvePreviewImage(userstyle.previewImage);
    const sourceCode = await uploadBlob(new Blob([userstyle.sourceCode], { type: 'text/plain' }));
    return await createRecord(
      CLUB_USERSTYLE_COLLECTION,
      builder.create({ ...userstyle, previewImage, sourceCode }),
    );
  },
);

export const updateUserstyle = command(
  'unchecked',
  async ({
    rkey,
    userstyle,
  }: {
    rkey: RecordKey;
    userstyle: UserstyleContent & {
      previewImage?: BlobInput | Userstyle['previewImage'];
      createdAt: string;
    };
  }) => {
    const previewImage = await resolvePreviewImage(userstyle.previewImage);
    const sourceCode = await uploadBlob(new Blob([userstyle.sourceCode], { type: 'text/plain' }));
    return await putRecord(
      CLUB_USERSTYLE_COLLECTION,
      rkey,
      builder.update({ ...userstyle, previewImage, sourceCode }),
    );
  },
);

export const deleteUserstyle = command('unchecked', async (rkey: RecordKey) => {
  return await deleteRecord(CLUB_USERSTYLE_COLLECTION, rkey);
});
