import { CLUB_COLLECTIONS } from './settings';

export const oauthScope = [
  'atproto',
  'blob:*/*',
  ...CLUB_COLLECTIONS.map((collection) => `repo:${collection}`),
].join(' ');
