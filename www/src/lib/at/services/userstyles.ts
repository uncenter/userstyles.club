import {
  createRecord,
  deleteRecord,
  getRecord,
  listRecordsForCollection,
  listRecordsForRepo,
  putRecord,
  uploadBlob,
  type RecordCommit,
} from '../records';
import { listCommentsForStyle, type CommentRecord, type CommentThread } from './comments';
import { listRatingsForStyle, type RatingRecord } from './ratings';

import { l, type AtIdentifierString, type AtUriString, type BlobRef, type RecordKeyString } from '@atproto/lex'
import { AtUri } from '@atproto/syntax';
import * as club from '../generated/club'

export type Userstyle = club.userstyles.alpha.userstyle.Main;
export type UserstyleRecord = RecordCommit<Userstyle>;

export type UserstyleContent = Omit<Userstyle, '$type' | 'previewImage' | 'createdAt' | 'updatedAt'>;
export type UserstyleInput<Options extends { previewImage?: any, createdAt?: Userstyle['createdAt'] }> = UserstyleContent & Options;

export function removeUpdateUrlFromSource(sourceCode: string): string {
  return sourceCode
    .split('\n')
    .filter((line) => !/^\s*@updateURL\s/.test(line))
    .join('\n');
}

export async function listUserstyles(repo?: AtIdentifierString) {
  const response = await listRecordsForRepo(club.userstyles.alpha.userstyle, {
    repo,
    limit: 50,
  });

  return (response.records as UserstyleRecord[])
    .sort((a, b) => b.value.createdAt.localeCompare(a.value.createdAt));
}

export async function listMyUserstyles() {
  return listUserstyles();
}

export async function createUserstyle({ title, description, sourceCode, previewImage, license, upstreamUrl, homepageUrl }: UserstyleInput<{ previewImage?: Blob }>) {
  const previewImageBlob = previewImage ? await uploadBlob(previewImage) : undefined;

  return await createRecord(club.userstyles.alpha.userstyle, club.userstyles.alpha.userstyle.$parse({
    title,
    description,
    sourceCode,
    license,
    upstreamUrl,
    homepageUrl,
    ...(previewImageBlob && { previewImage: previewImageBlob }),
    createdAt: l.currentDatetimeString()
  }));
}

export async function getUserstyle(repo: AtIdentifierString, rkey: RecordKeyString) {
  return await getRecord(club.userstyles.alpha.userstyle, {
    repo,
    rkey,
  });
}

export async function updateUserstyle(rkey: RecordKeyString, { title, description, sourceCode, previewImage, license, upstreamUrl, homepageUrl, createdAt }: UserstyleInput<{ previewImage?: Blob | BlobRef, createdAt: Userstyle['createdAt'] }>) {
  const previewImageBlob =
    previewImage instanceof Blob ? await uploadBlob(previewImage) : previewImage;

  return await putRecord(club.userstyles.alpha.userstyle, club.userstyles.alpha.userstyle.$parse({
    title,
    description,
    sourceCode,
    license,
    upstreamUrl,
    homepageUrl,
    ...(previewImageBlob && { previewImage: previewImageBlob }),
    createdAt,
  }), {
    rkey
  });
}

export async function deleteUserstyle(rkey: RecordKeyString) {
  return await deleteRecord(club.userstyles.alpha.userstyle, { rkey });
}

export async function listAllUserstyles() {
  const { records } = await listRecordsForCollection(club.userstyles.alpha.userstyle);
  return records;
}

export type ReviewThread = CommentThread & {
  rating?: RatingRecord;
}

export type UserstyleFeedback = { comments: CommentRecord[], ratings: Record<string, RatingRecord> };

export async function getUserstyleFeedback(userstyle: AtUriString): Promise<UserstyleFeedback> {
  const [comments, ratings]: [CommentRecord[], RatingRecord[]] = await Promise.all([listCommentsForStyle(userstyle), listRatingsForStyle(userstyle)]);

  const ratingsByDid: Record<string, RatingRecord> = Object.fromEntries(
    ratings.map((r) => [new AtUri(r.uri).did, r])
  );

  return { comments, ratings: ratingsByDid };
}
