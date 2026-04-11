import { BSKY_POST_COLLECTION } from '../settings';
import { getSessionContext } from '../auth';

export async function createPost(text: string) {
  const { client, did } = getSessionContext('You must be logged in to post.');

  const content = text.trim();
  if (!content) throw new Error('Post text is required.');
  if (content.length > 300) throw new Error('Post must be 300 characters or fewer.');

  // @ts-expect-error - XRPC is valid but not available in current package typings.
  const response = await client.post('com.atproto.repo.createRecord', {
    input: {
      repo: did,
      collection: BSKY_POST_COLLECTION,
      record: {
        $type: BSKY_POST_COLLECTION,
        text: content,
        createdAt: new Date().toISOString()
      }
    }
  });

  if (!response.ok) {
    throw new Error('Failed to create Bluesky post');
  }

  return response.data as { uri?: string; cid?: string };
}
