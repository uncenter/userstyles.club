import type { Did } from '@atcute/lexicons';
import { getClientForDid, getPublicClient } from './client';
import { getSessionContext } from './auth';

export type RepoRecord = {
  uri: string;
  cid?: string;
  value: Record<string, unknown>;
};

export type ListRecordsResult = {
  records: RepoRecord[];
  cursor?: string;
};

export async function listRecordsForRepo(params: {
  repo: string;
  collection: string;
  limit?: number;
  cursor?: string;
}): Promise<ListRecordsResult> {
  const { repo, collection, limit = 50, cursor } = params;

  const client = repo.startsWith('did:')
    ? await getClientForDid(repo as Did)
    : getPublicClient();

  // @ts-expect-error - XRPC is valid but not available in current package typings.
  const response = await client.get('com.atproto.repo.listRecords', {
    params: { repo, collection, limit, cursor }
  });

  if (!response.ok) {
    throw new Error('Failed to list records');
  }

  const data = response.data as { records?: RepoRecord[]; cursor?: string } | null;

  return {
    records: data?.records ?? [],
    cursor: data?.cursor
  };
}

export async function getRecord(params: {
  repo: string;
  collection: string;
  rkey: string;
}): Promise<RepoRecord | null> {
  const { repo, collection, rkey } = params;

  const client = repo.startsWith('did:')
    ? await getClientForDid(repo as Did)
    : getPublicClient();

  // @ts-expect-error - XRPC is valid but not available in current package typings.
  const response = await client.get('com.atproto.repo.getRecord', {
    params: { repo, collection, rkey }
  });

  if (!response.ok) return null;

  return {
    uri: (response.data as { uri?: string }).uri ?? '',
    cid: (response.data as { cid?: string }).cid,
    value: (response.data as { value: Record<string, unknown> }).value
  };
}

export async function createRecord(collection: string, record: Record<string, unknown>) {
  const { client, did } = getSessionContext('You must be logged in to write records.');

  // @ts-expect-error - XRPC is valid but not available in current package typings.
  const response = await client.post('com.atproto.repo.createRecord', {
    input: {
      repo: did,
      collection,
      record
    }
  });

  if (!response.ok) {
    throw new Error('Failed to create record');
  }

  return response.data as { uri?: string; cid?: string };
}

export async function putRecord(collection: string, rkey: string, record: Record<string, unknown>) {
  const { client, did } = getSessionContext('You must be logged in to write records.');

  // @ts-expect-error - XRPC is valid but not available in current package typings.
  const response = await client.post('com.atproto.repo.putRecord', {
    input: {
      repo: did,
      collection,
      rkey,
      record
    }
  });

  if (!response.ok) {
    throw new Error('Failed to update record');
  }

  return response.data;
}

export async function deleteRecord(collection: string, rkey: string) {
  const { client, did } = getSessionContext('You must be logged in to write records.');

  // @ts-expect-error - XRPC is valid but not available in current package typings.
  const response = await client.post('com.atproto.repo.deleteRecord', {
    input: {
      repo: did,
      collection,
      rkey
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete record');
  }

  return true;
}
