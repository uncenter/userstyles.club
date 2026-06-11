import { base } from '$app/paths';
import {
  CLUB_PROFILE_COLLECTION,
  REDIRECT_PATH,
  CLUB_USERSTYLE_COLLECTION,
  CLUB_REVIEW_COLLECTION,
  getSiteOrigin
} from './settings';

const scope = [
  'atproto',
  'blob:*/*',
  `repo:${CLUB_USERSTYLE_COLLECTION}`,
  `repo:${CLUB_PROFILE_COLLECTION}`,
  `repo:${CLUB_REVIEW_COLLECTION}`
].join(' ');

export function getClientMetadata() {
  const origin = getSiteOrigin();
  const normalizedBase = base || '';
  const root = `${origin}${normalizedBase}`;
  return {
    client_id: `${root}/oauth-client-metadata.json`,
    redirect_uri: `${root}${REDIRECT_PATH}`,
    scope
  };
}

export const oauthScope = scope;
