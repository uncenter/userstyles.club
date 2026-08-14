import type { Blob as BlobRef, Nsid, RecordKey } from '@atcute/lexicons';
import { ok } from '@atcute/client';

import type { ValueFor } from '../at/records';
import { getSessionContext } from './session';

export async function createRecord<NSID extends Nsid>(collection: NSID, record: ValueFor<NSID>) {
  const { client, did } = await getSessionContext('You must be logged in to write records.');

  const response = await ok(
    client.post('com.atproto.repo.createRecord', {
      input: {
        repo: did,
        collection,
        record: record as Record<string, unknown>,
      },
    }),
  );

  return { response, record };
}

export async function putRecord<NSID extends Nsid>(
  collection: NSID,
  rkey: RecordKey,
  record: ValueFor<NSID>,
) {
  const { client, did } = await getSessionContext('You must be logged in to write records.');

  const response = await ok(
    client.post('com.atproto.repo.putRecord', {
      input: {
        repo: did,
        collection,
        rkey,
        record: record as Record<string, unknown>,
      },
    }),
  );

  return { response, record };
}

export async function uploadBlob(blob: Blob): Promise<BlobRef> {
  const { client } = await getSessionContext('You must be logged in to upload files.');

  const response = await ok(
    client.post('com.atproto.repo.uploadBlob', {
      encoding: blob.type as `${string}/${string}`,
      input: blob,
    }),
  );

  return response.blob;
}

export async function deleteRecord(collection: Nsid, rkey: RecordKey) {
  const { client, did } = await getSessionContext('You must be logged in to write records.');

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
