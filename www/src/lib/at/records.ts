import { getConstellationClient, getPdsClient, getRelayClient, getSessionClient, getSlingshotClient } from './client';

import { getMain, type AtUriString, type BlobRef, type CreateOptions, type DeleteOptions, type GetOptions, type Infer, type InferOutput, type ListOptions, type Main, type PutOptions, type RecordSchema } from '@atproto/lex';
import * as com from '../at/generated/com';
import * as blue from '../at/generated/blue';

export type RecordCommit<T> = {
  uri: AtUriString;
  cid?: string;
  value: T
}

export async function listRecordsForRepo<const T extends RecordSchema>(
  ns: Main<T>,
  params: ListOptions
) {
  const { repo } = params;

  const client = repo ? await getPdsClient(repo) : getSessionClient();

  return await client.list(ns, params);
}

export async function listReposByCollection<const T extends RecordSchema>(
  ns: Main<T>,
  params: {
    limit?: number
    cursor?: string;
  }
) {
  const client = getRelayClient();

  return await client.call(com.atproto.sync.listReposByCollection, {
    collection: getMain(ns).$type,
    ...params
  });
}

export async function listRecordsForCollection<const T extends RecordSchema>(
  ns: Main<T>,
  params: {
    limit?: number
  } = {}
) {
  const { repos } = await listReposByCollection(ns, params);

  const records = [];
  for (const repo of repos) {
    try {
      const listed = await listRecordsForRepo(ns, {
        repo: repo.did,
      });
      records.push(...listed.records);
    } catch (e) {}
  }

  return { records };
}

export async function getBacklinksFrom<const T extends RecordSchema>(ns: Main<T>, subject: AtUriString, path: keyof InferOutput<T> & string) {
  const client = getConstellationClient();

  return await client.call(blue.microcosm.links.getBacklinks, {
    subject,
    source: `${getMain(ns).$type}:${path}`,
    limit: 100,
  });
}

export async function resolveBacklinkedRecords<const T extends RecordSchema>(ns: Main<T>, backlinks: Awaited<ReturnType<typeof getBacklinksFrom>>) {
  const client = getSessionClient(false) ?? getSlingshotClient();
  const schema = getMain(ns);

  const records = await Promise.all(
    backlinks.records.map(async ({ did, collection, rkey }) => {
      try {
        const response = await client.getRecord(collection, rkey, {
          repo: did
        });

        const value = schema.validate(response.body.value)
        return { ...response.body, value };
      } catch {
        return null;
      }
    }),
  );

  return records.filter((r) => r !== null);
}

export async function getRecord<const T extends RecordSchema>(
  ns: Main<T>,
  params: GetOptions<T>
){
  const client = getSessionClient(false) ?? getSlingshotClient();

  return await client.get(ns, params);
}

export async function createRecord<const T extends RecordSchema>(
  ns: Main<T>,
  record: Omit<Infer<T>, '$type'>,
  options: CreateOptions<T> = {} as CreateOptions<T>,
) {
  const client = getSessionClient();

  const response = await client.create(ns, record, options)

  return { response, record };
}

export async function putRecord<const T extends RecordSchema>(
  ns: Main<T>,
  record: Omit<Infer<T>, '$type'>,
  options: PutOptions<T> = {} as PutOptions<T>
) {
  const client = getSessionClient();

  const response = await client.put(ns, record, options)

  return { response, record };
}

export async function uploadBlob(blob: Blob): Promise<BlobRef> {
  const client = getSessionClient('You must be logged in to upload files.');

  const response = await client.uploadBlob(blob, {
    encoding: blob.type as `${string}/${string}`
  })

  return response.body.blob;
}

export async function deleteRecord<const T extends RecordSchema>(
  ns: Main<T>,
  options: DeleteOptions<T>
) {
  const client = getSessionClient();

  await client.delete(ns, options);

  return true;
}
