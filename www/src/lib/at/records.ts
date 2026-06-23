import type {
  ActorIdentifier,
  Blob as BlobRef,
  Did,
  Nsid,
  RecordKey,
  ResourceUri,
} from '@atcute/lexicons';
import { getClientForDid, getConstellationClient, getPublicClient, getRelayClient } from './client';
import { getSessionContext } from './auth';
import { isDid } from '@atcute/lexicons/syntax';
import { ok } from '@atcute/client';
import { resolveHandle } from './did';

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
      params: { repo, collection, limit, cursor },
    }),
  );

  return {
    records: response.records,
    cursor: response.cursor,
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
      params: { collection, limit, cursor },
    }),
  );

  return {
    repos: response.repos,
    cursor: response.cursor,
  };
}

export async function listRecordsForCollection(params: { collection: Nsid; limit?: number }) {
  const { repos } = await listReposByCollection(params);

  const records: RepoRecord[] = [];
  for (const repo of repos) {
    try {
      const listed = await listRecordsForRepo({
        repo: repo.did as Did,
        collection: params.collection,
      });
      records.push(...listed.records);
    } catch (e) {}
  }

  return { records };
}

export async function getBacklinksTo(subject: ResourceUri, collection: Nsid, path: string) {
  const client = getConstellationClient();

  const response = await ok(
    client.get('blue.microcosm.links.getBacklinks', {
      params: {
        subject,
        source: `${collection}:${path}`,
        limit: 100,
      },
    }),
  );

  return response;
}

export async function resolveBacklinkedRecords(backlinks: Awaited<ReturnType<typeof getBacklinksTo>>) {
  const records = await Promise.all(
    backlinks.records.map(async ({ did, collection, rkey }) => {
      try {
        return (await getRecord({
          repo: did,
          collection,
          rkey,
        }));
      } catch {
        return null;
      }
    }),
  );

  return records.filter((r) => r !== null);
}

export async function getRecord(params: {
  repo: ActorIdentifier;
  collection: Nsid;
  rkey: RecordKey;
}): Promise<RepoRecord> {
  const { repo, collection, rkey } = params;

  const did = isDid(repo) ? repo : await resolveHandle(repo);
  const client = await getClientForDid(did);

  const response = await ok(
    client.get('com.atproto.repo.getRecord', {
      params: { repo, collection, rkey },
    }),
  );

  return response;
}

export async function createRecord<T extends Record<string, unknown>>(collection: Nsid, record: T) {
  const { client, did } = getSessionContext('You must be logged in to write records.');

  const response = await ok(
    client.post('com.atproto.repo.createRecord', {
      input: {
        repo: did,
        collection,
        record,
      },
    }),
  );

  return { response, record };
}

export async function putRecord<T extends Record<string, unknown>>(
  collection: Nsid,
  rkey: RecordKey,
  record: T,
) {
  const { client, did } = getSessionContext('You must be logged in to write records.');

  const response = await ok(
    client.post('com.atproto.repo.putRecord', {
      input: {
        repo: did,
        collection,
        rkey,
        record,
      },
    }),
  );

  return { response, record };
}

export async function uploadBlob(blob: Blob): Promise<BlobRef> {
  const { client } = getSessionContext('You must be logged in to upload files.');

  const response = await ok(
    client.post('com.atproto.repo.uploadBlob', {
      encoding: blob.type as `${string}/${string}`,
      input: blob,
    }),
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
        rkey,
      },
    }),
  );

  return true;
}
