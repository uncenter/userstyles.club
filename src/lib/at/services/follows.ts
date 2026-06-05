import { FOLLOW_COLLECTION } from '../settings';
import { getSessionContext } from '../auth';
import type { Did, RecordKey } from '@atcute/lexicons';
import { ok } from '@atcute/client';

export type FollowState = {
  isFollowing: boolean;
  followUri: string | null;
};

export async function getFollowState(subjectDid: Did): Promise<FollowState> {
  const { client, did } = getSessionContext('You must be logged in to inspect follow state.');
  let cursor: string | undefined;

  do {
    const response = await ok(
      client.get('com.atproto.repo.listRecords', {
        params: {
          repo: did,
          collection: FOLLOW_COLLECTION,
          cursor,
          limit: 100
        }
      })
    );

    const match = response.records.find((record) => record.value.subject === subjectDid);
    if (match) {
      return {
        isFollowing: true,
        followUri: match.uri
      };
    }

    cursor = response.cursor;
  } while (cursor);

  return {
    isFollowing: false,
    followUri: null
  };
}

export async function followActor(subjectDid: Did) {
  const { client, did } = getSessionContext('You must be logged in to follow accounts.');

  const response = await ok(
    client.post('com.atproto.repo.createRecord', {
      input: {
        repo: did,
        collection: FOLLOW_COLLECTION,
        record: {
          $type: FOLLOW_COLLECTION,
          subject: subjectDid,
          createdAt: new Date().toISOString()
        }
      }
    })
  );

  return response;
}

export async function unfollowActor(rkey: RecordKey) {
  const { client, did } = getSessionContext('You must be logged in to unfollow accounts.');

  await ok(
    client.post('com.atproto.repo.deleteRecord', {
      input: {
        repo: did,
        collection: FOLLOW_COLLECTION,
        rkey
      }
    })
  );

  return true;
}
