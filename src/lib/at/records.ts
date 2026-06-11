import type { ActorIdentifier, Blob as BlobRef, Did, Nsid, RecordKey, ResourceUri } from '@atcute/lexicons';
import { getClientForDid, getPublicClient, getRelayClient } from './client';
import { getSessionContext } from './auth';
import { isDid } from '@atcute/lexicons/syntax';
import { ok } from '@atcute/client';

export type RepoRecord = {
  uri: ResourceUri;
  cid?: string;
  value: Record<string, unknown>;
};

export type ListRecordsResult = {
  records: RepoRecord[];
  cursor?: string;
};

export async function listRecordsForRepo(params: {
  repo: ActorIdentifier;
  collection: Nsid;
  limit?: number;
  cursor?: string;
}): Promise<ListRecordsResult> {
  const { repo, collection, limit = 50, cursor } = params;

  const client = repo.startsWith('did:') ? await getClientForDid(repo as Did) : getPublicClient();

  const response = await ok(
    client.get('com.atproto.repo.listRecords', {
      params: { repo, collection, limit, cursor }
    })
  );

  return {
    records: response.records,
    cursor: response.cursor
  };
}

export type ListReposResult = {
  repos: { did: string }[];
  cursor?: string;
};

export async function listReposByCollection(params: {
  collection: Nsid;
  limit?: number;
  cursor?: string;
}): Promise<ListReposResult> {
  const { collection, limit = 50, cursor } = params;

  const client = getRelayClient();

  const response = await ok(
    client.get('com.atproto.sync.listReposByCollection', {
      params: { collection, limit, cursor }
    })
  );

  return {
    repos: response.repos,
    cursor: response.cursor
  };
}

export async function listRecordsForCollection(params: { collection: Nsid; limit?: number }) {
  const { repos } = await listReposByCollection(params);

  const records: RepoRecord[] = [];
  for (const repo of repos) {
    try {
      const listed = await listRecordsForRepo({
        repo: repo.did as Did,
        collection: params.collection
      });
      records.push(...listed.records);
    } catch (e) {}
  }

  return { records };
}

export async function getRecord(params: {
  repo: ActorIdentifier;
  collection: Nsid;
  rkey: RecordKey;
}): Promise<RepoRecord> {
  const { repo, collection, rkey } = params;

  const client = isDid(repo) ? await getClientForDid(repo) : getPublicClient();

  const response = await ok(
    client.get('com.atproto.repo.getRecord', {
      params: { repo, collection, rkey }
    })
  );

  return response;
}

export async function createRecord(collection: Nsid, record: Record<string, unknown>) {
  const { client, did } = getSessionContext('You must be logged in to write records.');

  const response = await ok(
    client.post('com.atproto.repo.createRecord', {
      input: {
        repo: did,
        collection,
        record
      }
    })
  );

  return { response, record };
}

export async function putRecord(
  collection: Nsid,
  rkey: RecordKey,
  record: Record<string, unknown>
) {
  const { client, did } = getSessionContext('You must be logged in to write records.');

  const response = await ok(
    client.post('com.atproto.repo.putRecord', {
      input: {
        repo: did,
        collection,
        rkey,
        record
      }
    })
  );

  return { response, record };
}

export async function uploadBlob(blob: Blob): Promise<BlobRef> {
  const { client } = getSessionContext('You must be logged in to upload files.');

  const response = await ok(
    client.post('com.atproto.repo.uploadBlob', {
      encoding: blob.type as `${string}/${string}`,
      input: blob
    })
  );

  return response.blob;
}

export async function deleteRecord(collection: Nsid, rkey: RecordKey) {
  const { client, did } = getSessionContext('You must be logged in to write records.');

  await ok(
    client.post('com.atproto.repo.deleteRecord', {
      input: {
        repo: did,
        collection,
        rkey
      }
    })
  );

  return true;
}
