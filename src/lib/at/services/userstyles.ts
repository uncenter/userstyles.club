import type { ActorIdentifier, RecordKey, Blob as BlobRef } from '@atcute/lexicons';
import { getSessionContext } from '../auth';
import {
  createRecord,
  deleteRecord,
  getRecord,
  listRecordsForCollection,
  listRecordsForRepo,
  putRecord,
  uploadBlob,
  type RepoRecord
} from '../records';
import { CLUB_USERSTYLE_COLLECTION } from '../settings';

export type Userstyle = {
  title: string;
  description?: string;
  sourceCode: string;
  createdAt: string;
  updatedAt?: string;
  previewImage?: BlobRef;
};

export type UserstyleRecord = RepoRecord & {
  value: Userstyle;
};

function isUserstyle(value: Record<string, unknown>): value is Userstyle {
  return typeof value.title === 'string' && typeof value.sourceCode === 'string';
}

export async function listUserstyles(repo: ActorIdentifier) {
  const response = await listRecordsForRepo({
    repo,
    collection: CLUB_USERSTYLE_COLLECTION,
    limit: 50
  });

  return response.records
    .filter((record): record is UserstyleRecord => isUserstyle(record.value))
    .sort((a, b) => b.value.createdAt.localeCompare(a.value.createdAt));
}

export async function listMyUserstyles() {
  const { did } = getSessionContext('You must be logged in to read your userstyles.');
  return listUserstyles(did);
}

export async function createUserstyle(
  title: string,
  description: string,
  sourceCode: string,
  previewImage?: File
) {
  title = title.trim();
  if (!title) throw new Error('Userstyle title is required.');
  if (title.length > 140) throw new Error('Userstyle title must be 140 characters or fewer.'); // TODO: Grapheme validation?

  const previewImageBlob = previewImage ? await uploadBlob(previewImage) : undefined;

  return createRecord(CLUB_USERSTYLE_COLLECTION, {
    $type: CLUB_USERSTYLE_COLLECTION,
    title,
    ...(description.trim() && { description }),
    sourceCode,
    createdAt: new Date().toISOString(),
    ...(previewImageBlob && { previewImage: previewImageBlob })
  });
}

export async function getUserstyle(repo: ActorIdentifier, rkey: RecordKey) {
  const response = (await getRecord({
    repo,
    collection: CLUB_USERSTYLE_COLLECTION,
    rkey
  })) as UserstyleRecord;

  return response.value;
}

export async function updateUserstyle(
  rkey: RecordKey,
  title: string,
  description: string,
  sourceCode: string,
  createdAt: string,
  previewImage?: File | BlobRef
) {
  title = title.trim();
  if (!title) throw new Error('Userstyle title is required.');
  if (title.length > 140) throw new Error('Userstyle title must be 140 characters or fewer.');

  const previewImageBlob =
    previewImage instanceof File ? await uploadBlob(previewImage) : previewImage;

  return putRecord(CLUB_USERSTYLE_COLLECTION, rkey, {
    $type: CLUB_USERSTYLE_COLLECTION,
    title,
    ...(description.trim() && { description }),
    sourceCode,
    createdAt,
    updatedAt: new Date().toISOString(),
    ...(previewImageBlob && { previewImage: previewImageBlob })
  });
}

export async function deleteUserstyle(rkey: RecordKey) {
  return await deleteRecord(CLUB_USERSTYLE_COLLECTION, rkey);
}

export async function listAllUserstyles() {
  const response = await listRecordsForCollection({ collection: CLUB_USERSTYLE_COLLECTION });
  return response.records as UserstyleRecord[];
}
