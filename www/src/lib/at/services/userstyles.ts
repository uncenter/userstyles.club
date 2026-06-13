import type { ActorIdentifier, RecordKey, Blob as BlobRef, GenericUri } from '@atcute/lexicons';
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
  previewImage?: BlobRef;
  license?: string;
  upstreamUrl?: string;
  homepageUrl?: string;
  createdAt: string;
  updatedAt?: string;
};

// Input type for creating/updating a userstyle.
export type UserstyleInput = Omit<Userstyle, 'createdAt' | 'updatedAt' | 'previewImage'> & {
  previewImage?: File;
};

export type UserstyleRecord = RepoRecord & {
  value: Userstyle;
};

export function removeUpdateUrlFromSource(sourceCode: string): string {
  return sourceCode
    .split('\n')
    .filter((line) => !/^\s*@updateURL\s/.test(line))
    .join('\n');
}

function validateUserstyle<T extends Omit<UserstyleInput, 'previewImage'>>(userstyle: T): T {
  const title = userstyle.title.trim();
  if (!title) throw new Error('Userstyle title is required.');
  if (title.length > 140) throw new Error('Userstyle title must be 140 characters or fewer.');
  return { ...userstyle, title };
}

function optionals<K extends keyof Userstyle>(
  obj: Partial<Pick<Userstyle, K>>
): Partial<Pick<Userstyle, K>> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => typeof v !== 'string' || v.trim())
  ) as Partial<Pick<Userstyle, K>>;
}

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

export async function createUserstyle(userstyle: UserstyleInput) {
  const { title, description, sourceCode, previewImage, license, upstreamUrl, homepageUrl } = validateUserstyle(userstyle);

  const previewImageBlob = previewImage ? await uploadBlob(previewImage) : undefined;

  return createRecord(CLUB_USERSTYLE_COLLECTION, {
    $type: CLUB_USERSTYLE_COLLECTION,
    title,
    ...optionals({
      description,
      license,
      upstreamUrl,
      homepageUrl,
    }),
    sourceCode,
    ...(previewImageBlob && { previewImage: previewImageBlob }),
    createdAt: new Date().toISOString(),
  } satisfies Partial<Userstyle> & { $type: string });
}

export async function getUserstyle(repo: ActorIdentifier, rkey: RecordKey) {
  const response = (await getRecord({
    repo,
    collection: CLUB_USERSTYLE_COLLECTION,
    rkey
  })) as UserstyleRecord;

  return response;
}

type UpdateUserstyleInput = Omit<UserstyleInput, 'previewImage'> & {
  previewImage?: File | BlobRef;
  createdAt: string;
};

export async function updateUserstyle(rkey: RecordKey, userstyle: UpdateUserstyleInput) {
  const { title, description, sourceCode, previewImage, license, upstreamUrl, homepageUrl } = validateUserstyle(userstyle);

  const previewImageBlob = previewImage instanceof File ? await uploadBlob(previewImage) : previewImage;

  return putRecord(CLUB_USERSTYLE_COLLECTION, rkey, {
    $type: CLUB_USERSTYLE_COLLECTION,
    title,
    ...optionals({
      description,
      license,
      upstreamUrl,
      homepageUrl,
    }),
    sourceCode,
    ...(previewImageBlob && { previewImage: previewImageBlob }),
    createdAt: userstyle.createdAt,
    updatedAt: new Date().toISOString(),
  } satisfies Partial<Userstyle> & { $type: string });
}

export async function deleteUserstyle(rkey: RecordKey) {
  return await deleteRecord(CLUB_USERSTYLE_COLLECTION, rkey);
}

export async function listAllUserstyles() {
  const response = await listRecordsForCollection({ collection: CLUB_USERSTYLE_COLLECTION });
  return response.records as UserstyleRecord[];
}
