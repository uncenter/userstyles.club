import { base } from '$app/paths';
import {
  BSKY_POST_COLLECTION,
  EXAMPLE_NOTE_COLLECTION,
  FOLLOW_COLLECTION,
  REDIRECT_PATH,
  USERSTYLE_COLLECTION,
  getSiteOrigin
} from './settings';

const scope = [
  'atproto',
  'blob:*/*',
  `repo:${FOLLOW_COLLECTION}`,
  `repo:${BSKY_POST_COLLECTION}`,
  `repo:${EXAMPLE_NOTE_COLLECTION}`,
  `repo:${USERSTYLE_COLLECTION}`
].join(' ');

export function getClientMetadata() {
  const origin = getSiteOrigin();
  const normalizedBase = base || '';
  const root = `${origin}${normalizedBase}`;
  return {
    client_id: `${root}/client-metadata.json`,
    redirect_uri: `${root}${REDIRECT_PATH}`,
    scope
  };
}

export const oauthScope = scope;
