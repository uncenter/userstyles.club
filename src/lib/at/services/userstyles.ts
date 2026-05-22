import type { ActorIdentifier, Did, RecordKey } from "@atcute/lexicons";
import { getSessionContext } from "../auth";
import { createRecord, deleteRecord, getRecord, listRecordsForCollection, listRecordsForRepo, type RepoRecord } from "../records";
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

export async function listUserstyles(repo: ActorIdentifier) {
  const response = await listRecordsForRepo({
    repo,
    collection: USERSTYLE_COLLECTION,
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

export async function getUserstyle(repo: ActorIdentifier, rkey: RecordKey) {
  const response = await getRecord({
    repo,
    collection: USERSTYLE_COLLECTION,
    rkey,
  }) as UserstyleRecord;

  return response.value;
}

export async function deleteUserstyle(rkey: RecordKey) {
  return await deleteRecord(USERSTYLE_COLLECTION, rkey);
}

export async function listAllUserstyles() {
  const response = await listRecordsForCollection({ collection: USERSTYLE_COLLECTION });
  return response.records as UserstyleRecord[];
}
