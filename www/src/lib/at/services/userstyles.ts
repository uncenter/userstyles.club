
import { getSessionContext } from '../auth';
import {
  createRecord,
  deleteRecord,
  getRecord,
  listRecordsForCollection,
  listRecordsForRepo,
  putRecord,
  uploadBlob,
  type RepoRecord,
} from '../records';

import { listCommentsForStyle, type CommentRecord, type CommentThread } from './comments';
import { listRatingsForStyle, type RatingRecord } from './ratings';

import { type ActorIdentifier, type RecordKey, type Blob as BlobRef, type ResourceUri, parseResourceUri } from '@atcute/lexicons';
import { is } from '@atcute/lexicons/validations';

import { makeRecordBuilder } from '../builder';
import { CLUB_USERSTYLE_COLLECTION } from '../settings';
import { ClubUserstylesAlphaUserstyle } from '$lib/at/lexicons';

export type Userstyle = ClubUserstylesAlphaUserstyle.Main;

export type UserstyleContent = Omit<Userstyle, '$type' | 'previewImage' | 'createdAt' | 'updatedAt'>;

export type UserstyleInput<Options extends { previewImage?: any; createdAt?: Userstyle['createdAt'] } = Record<never, never>> = UserstyleContent & Options;

export type UserstyleRecord = RepoRecord<Userstyle>;

const builder = makeRecordBuilder(ClubUserstylesAlphaUserstyle.mainSchema, CLUB_USERSTYLE_COLLECTION, {
  keepAsIsStringFields: ['sourceCode'],
});

export function removeUpdateUrlFromSource(sourceCode: string): string {
  return sourceCode
    .split('\n')
    .filter((line) => !/^\s*@updateURL\s/.test(line))
    .join('\n');
}

export async function listUserstyles(repo: ActorIdentifier) {
  const response = await listRecordsForRepo({
    repo,
    collection: CLUB_USERSTYLE_COLLECTION,
    limit: 50,
  });

  return response.records
    .filter((record): record is UserstyleRecord => is(ClubUserstylesAlphaUserstyle.mainSchema, record.value))
    .sort((a, b) => b.value.createdAt.localeCompare(a.value.createdAt));
}

export async function listMyUserstyles() {
  const { did } = getSessionContext('You must be logged in to read your userstyles.');
  return await listUserstyles(did);
}

export async function createUserstyle(userstyle: UserstyleInput<{ previewImage?: File }>) {
  const previewImage = userstyle.previewImage ? await uploadBlob(userstyle.previewImage) : undefined;
  return await createRecord(CLUB_USERSTYLE_COLLECTION, builder.create({ ...userstyle, previewImage }));
}

export async function getUserstyle(repo: ActorIdentifier, rkey: RecordKey) {
  return await getRecord({
    repo,
    collection: CLUB_USERSTYLE_COLLECTION,
    rkey,
  });
}

export async function updateUserstyle(
  rkey: RecordKey,
  userstyle: UserstyleInput<{ previewImage?: File | Userstyle['previewImage']; createdAt: string }>,
) {
  const previewImage =
    userstyle.previewImage instanceof File
      ? await uploadBlob(userstyle.previewImage)
      : userstyle.previewImage;

  return await putRecord(CLUB_USERSTYLE_COLLECTION, rkey, builder.update({ ...userstyle, previewImage }));
}

export async function deleteUserstyle(rkey: RecordKey) {
  return await deleteRecord(CLUB_USERSTYLE_COLLECTION, rkey);
}

export async function listAllUserstyles() {
  const response = await listRecordsForCollection({ collection: CLUB_USERSTYLE_COLLECTION });
  return response.records;
}

export type ReviewThread = CommentThread & {
  rating?: RatingRecord;
}

export type UserstyleFeedback = { comments: CommentRecord[], ratings: Record<string, RatingRecord> };

export async function getUserstyleFeedback(userstyle: ResourceUri): Promise<UserstyleFeedback> {
  let st = performance.now();
  const [comments, ratings]: [CommentRecord[], RatingRecord[]] = await Promise.all([listCommentsForStyle(userstyle), listRatingsForStyle(userstyle)]);
  console.log(`Fetched feedback in ${performance.now() - st} ms.`)

  const ratingsByDid: Record<string, RatingRecord> = Object.fromEntries(
    ratings.map((r) => [parseResourceUri(r.uri).repo!, r])
  );

  return { comments, ratings: ratingsByDid };
}
