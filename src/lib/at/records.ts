import type {
  ActorIdentifier,
  Blob as BlobRef,
  CanonicalResourceUri,
  Did,
  LegacyBlob,
  Nsid,
  RecordKey,
} from '@atcute/lexicons';
import type { Records } from '@atcute/lexicons/ambient';
import type * as v from '@atcute/lexicons/validations';

import { getPdsClient, getConstellationClient, getPublicClient, getRelayClient } from './client';
import { getBlobCid } from './utils';
import { ok } from '@atcute/client';

export type RepoRecord<T extends Record<string, unknown> = Record<string, unknown>> = {
  uri: CanonicalResourceUri;
  cid?: string;
  value: T;
};

/** Maps a lexicon NSID to its record value type via the ambient registry. Falls back to `Record<string, unknown>` for unregistered collections. */
export type ValueFor<NSID extends Nsid> = [NSID] extends [keyof Records]
  ? v.InferInput<Records[NSID]>
  : Record<string, unknown>;

export type ListRecordsResult<T extends Record<string, unknown> = Record<string, unknown>> = {
  records: RepoRecord<T>[];
  cursor?: string;
};

export async function listRecordsForRepo<NSID extends Nsid>(params: {
  repo: ActorIdentifier;
  collection: NSID;
  limit?: number;
  cursor?: string;
}): Promise<ListRecordsResult<ValueFor<NSID>>> {
  const { repo, collection, limit = 50, cursor } = params;

  const client = repo.startsWith('did:') ? await getPdsClient(repo) : getPublicClient();

  const response = await ok(
    client.get('com.atproto.repo.listRecords', {
      params: { repo, collection, limit, cursor },
    }),
  );

  return {
    records: response.records as RepoRecord<ValueFor<NSID>>[],
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

/**
 * Slow relay-fanout fallback for {@link listAllUserstyles}: walks every repo that publishes the collection and fetches each one's records directly.
 */
export async function listRecordsForCollection<NSID extends Nsid>(params: {
  collection: NSID;
  limit?: number;
}): Promise<RepoRecord<ValueFor<NSID>>[]> {
  const { repos } = await listReposByCollection(params);

  const records: RepoRecord<ValueFor<NSID>>[] = [];
  for (const repo of repos) {
    try {
      const listed = await listRecordsForRepo({
        repo: repo.did as Did,
        collection: params.collection,
      });
      records.push(...listed.records);
    } catch (e) {}
  }

  return records;
}

export async function getBacklinkedRecords<NSID extends Nsid>(params: {
  subject: CanonicalResourceUri;
  collection: NSID;
  path: string;
  did?: Did[];
}): Promise<RepoRecord<ValueFor<NSID>>[]> {
  const { subject, collection, path, did } = params;

  const client = getConstellationClient();

  const backlinks = await ok(
    client.get('blue.microcosm.links.getBacklinks', {
      params: { subject, source: `${collection}:${path}`, limit: 100, did },
    }),
  );

  const records = await Promise.all(
    backlinks.records.map(async ({ did, collection, rkey }) => {
      try {
        return (await getRecord({ repo: did, collection, rkey })) as RepoRecord<ValueFor<NSID>>;
      } catch {
        return null;
      }
    }),
  );

  return records.filter((r): r is RepoRecord<ValueFor<NSID>> => r !== null);
}

export async function getRecord<NSID extends Nsid>(params: {
  repo: ActorIdentifier;
  collection: NSID;
  rkey: RecordKey;
}): Promise<RepoRecord<ValueFor<NSID>>> {
  const { repo, collection, rkey } = params;

  const client = await getPdsClient(repo);

  const response = await ok(
    client.get('com.atproto.repo.getRecord', {
      params: { repo, collection, rkey },
    }),
  );

  return response as RepoRecord<ValueFor<NSID>>;
}

export async function getBlobText(did: Did, blob: BlobRef | LegacyBlob): Promise<string> {
  const client = await getPdsClient(did);
  const cid = getBlobCid(blob);

  const response = await ok(
    client.get('com.atproto.sync.getBlob', {
      params: { did, cid },
      as: 'blob',
    }),
  );

  return await response.text();
}
