import { getSessionContext } from "../auth";
import { createRecord, deleteRecord, listRecordsForRepo, type RepoRecord } from "../records";
import { USERSTYLE_COLLECTION } from "../settings";

export type Userstyle = {
  title: string;
  sourceCode: string;
  createdAt: string;
  updatedAt: string;
};

export type UserstyleRecord = RepoRecord & {
  value: Userstyle;
};

function isUserstyle(value: Record<string, unknown>): value is Userstyle {
  return typeof value.title === 'string' && typeof value.sourceCode === 'string';
}

export async function listMyUserstyles() {
  const { did } = getSessionContext('You must be logged in to read your userstyles.');
  const response = await listRecordsForRepo({
    repo: did,
    collection: USERSTYLE_COLLECTION,
    limit: 50
  });

  return response.records
    .filter((record): record is UserstyleRecord => isUserstyle(record.value))
    .sort((a, b) => b.value.createdAt.localeCompare(a.value.createdAt));
}

export async function createUserstyle(title: string, sourceCode: string) {
  title = title.trim();
  if (!title) throw new Error('Userstyle title is required.');
  if (title.length > 140) throw new Error('Userstyle title must be 140 characters or fewer.'); // TODO: Grapheme validation?

  return createRecord(USERSTYLE_COLLECTION, {
    $type: USERSTYLE_COLLECTION,
    title,
    sourceCode,
    createdAt: new Date().toISOString()
  });
}

export async function deleteUserstyle(uri: string) {
  const rkey = uri.split('/').pop();
  if (!rkey) {
    throw new Error('Userstyle record key is missing.');
  }

  await deleteRecord(USERSTYLE_COLLECTION, rkey);
  return true;
}