import { EXAMPLE_NOTE_COLLECTION } from '../settings';
import { createRecord, deleteRecord, listRecordsForRepo, type RepoRecord } from '../records';
import { getSessionContext } from '../auth';

export type ExampleNote = {
  text: string;
  createdAt: string;
};

export type ExampleNoteRecord = RepoRecord & {
  value: ExampleNote;
};

function isExampleNote(value: Record<string, unknown>): value is ExampleNote {
  return typeof value.text === 'string' && typeof value.createdAt === 'string';
}

export async function listMyNotes() {
  const { did } = getSessionContext('You must be logged in to read your notes.');
  const response = await listRecordsForRepo({
    repo: did,
    collection: EXAMPLE_NOTE_COLLECTION,
    limit: 50
  });

  return response.records
    .filter((record): record is ExampleNoteRecord => isExampleNote(record.value))
    .sort((a, b) => b.value.createdAt.localeCompare(a.value.createdAt));
}

export async function createNote(text: string) {
  const content = text.trim();
  if (!content) throw new Error('Note text is required.');
  if (content.length > 300) throw new Error('Note must be 300 characters or fewer.');

  return createRecord(EXAMPLE_NOTE_COLLECTION, {
    $type: EXAMPLE_NOTE_COLLECTION,
    text: content,
    createdAt: new Date().toISOString()
  });
}

export async function deleteNote(uri: string) {
  const rkey = uri.split('/').pop();
  if (!rkey) {
    throw new Error('Note record key is missing.');
  }

  await deleteRecord(EXAMPLE_NOTE_COLLECTION, rkey);
  return true;
}
