import type { Did } from '@atcute/lexicons';
import { getClientForDid } from '../client';

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

  // @ts-expect-error - XRPC is valid but not available in current package typings.
  const response = await client.get('com.atproto.repo.describeRepo', {
    params: { repo }
  });

  if (!response.ok) {
    throw new Error('Could not describe repo');
  }

  const data = response.data as { collections?: string[] } | null;
  return {
    client,
    collections: (data?.collections ?? []).sort()
  };
}

export async function listRepoCollection(params: {
  repo: Did;
  collection: string;
  limit: number;
  cursor?: string;
}) {
  const { repo, collection, limit, cursor } = params;
  const client = await getClientForDid(repo);

  // @ts-expect-error - XRPC is valid but not available in current package typings.
  const response = await client.get('com.atproto.repo.listRecords', {
    params: { repo, collection, limit, cursor }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch records for this collection.');
  }

  const data = response.data as { records?: RepoPreviewRecord[]; cursor?: string } | null;
  const records = data?.records ?? [];

  return {
    records,
    cursor: data?.cursor,
    hasMore: Boolean(data?.cursor) && records.length >= limit
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
