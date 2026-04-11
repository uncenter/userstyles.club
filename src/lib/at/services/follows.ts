import { FOLLOW_COLLECTION } from '../settings';
import { getSessionContext } from '../auth';

export type FollowState = {
  isFollowing: boolean;
  followUri: string | null;
};

export async function getFollowState(subjectDid: string): Promise<FollowState> {
  const { client, did } = getSessionContext('You must be logged in to inspect follow state.');
  let cursor: string | undefined;

  do {
    // @ts-expect-error - XRPC is valid but not available in current package typings.
    const response = await client.get('com.atproto.repo.listRecords', {
      params: {
        repo: did,
        collection: FOLLOW_COLLECTION,
        cursor,
        limit: 100
      }
    });

    if (!response.ok) break;

    const data = response.data as {
      records?: Array<{ uri: string; value: { subject: string } }>;
      cursor?: string;
    } | null;

    const match = (data?.records ?? []).find((record) => record.value.subject === subjectDid);
    if (match) {
      return {
        isFollowing: true,
        followUri: match.uri
      };
    }

    cursor = data?.cursor;
  } while (cursor);

  return {
    isFollowing: false,
    followUri: null
  };
}

export async function followActor(subjectDid: string) {
  const { client, did } = getSessionContext('You must be logged in to follow accounts.');

  // @ts-expect-error - XRPC is valid but not available in current package typings.
  const response = await client.post('com.atproto.repo.createRecord', {
    input: {
      repo: did,
      collection: FOLLOW_COLLECTION,
      record: {
        $type: FOLLOW_COLLECTION,
        subject: subjectDid,
        createdAt: new Date().toISOString()
      }
    }
  });

  if (!response.ok) {
    throw new Error('Could not follow account');
  }

  return (response.data as { uri?: string }).uri ?? null;
}

export async function unfollowActor(followUri: string) {
  const { client, did } = getSessionContext('You must be logged in to unfollow accounts.');
  const rkey = followUri.split('/').pop();
  if (!rkey) {
    throw new Error('Follow URI is missing');
  }

  // @ts-expect-error - XRPC is valid but not available in current package typings.
  const response = await client.post('com.atproto.repo.deleteRecord', {
    input: {
      repo: did,
      collection: FOLLOW_COLLECTION,
      rkey
    }
  });

  if (!response.ok) {
    throw new Error('Could not unfollow account');
  }

  return true;
}
