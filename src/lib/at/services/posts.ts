import { BSKY_POST_COLLECTION } from '../settings';
import { getSessionContext } from '../auth';
import { ok } from '@atcute/client';

export async function createPost(text: string) {
  const { client, did } = getSessionContext('You must be logged in to post.');

  const content = text.trim();
  if (!content) throw new Error('Post text is required.');
  if (content.length > 300) throw new Error('Post must be 300 characters or fewer.');

  const response = await ok(
    client.post('com.atproto.repo.createRecord', {
      input: {
        repo: did,
        collection: BSKY_POST_COLLECTION,
        record: {
          $type: BSKY_POST_COLLECTION,
          text: content,
          createdAt: new Date().toISOString()
        }
      }
    })
  );

  return response;
}
