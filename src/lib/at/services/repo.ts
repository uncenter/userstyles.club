import type { ActorIdentifier, Did, Nsid } from '@atcute/lexicons';
import { getClientForDid } from '../client';
import { ok } from '@atcute/client';

export type RepoPreviewRecord = {
  uri: string;
  cid?: string;
  value?: Record<string, unknown>;
};

export type RepoCollectionPreview = {
  collection: string;
  records: RepoPreviewRecord[];
  error?: string;
  cursor?: string;
  hasMore?: boolean;
};

export async function describeRepo(repo: Did) {
  const client = await getClientForDid(repo);

  const response = await ok(client.get('com.atproto.repo.describeRepo', {
    params: { repo }
  }));


  return {
    client,
    collections: response.collections.sort()
  };
}

export async function listRepoCollection(params: {
  repo: Did;
  collection: Nsid;
  limit: number;
  cursor?: string;
}) {
  const { repo, collection, limit, cursor } = params;
  const client = await getClientForDid(repo);

  const response = await ok(client.get('com.atproto.repo.listRecords', {
    params: { repo, collection, limit, cursor }
  }));


  return {
    records: response.records,
    cursor: response.cursor,
    hasMore: Boolean(response.cursor) && response.records.length >= limit
  };
}

export async function loadRepoCollectionPreviews(repo: Did, initialLimit: number) {
  const { collections } = await describeRepo(repo);
  const previews: RepoCollectionPreview[] = [];

  for (const collection of collections) {
    try {
      const preview = await listRepoCollection({
        repo,
        collection,
        limit: initialLimit
      });

      previews.push({
        collection,
        records: preview.records,
        cursor: preview.cursor,
        hasMore: preview.hasMore
      });
    } catch (error) {
      previews.push({
        collection,
        records: [],
        error: error instanceof Error ? error.message : 'Failed to fetch records for this collection.'
      });
    }
  }

  return {
    collections,
    previews
  };
}
