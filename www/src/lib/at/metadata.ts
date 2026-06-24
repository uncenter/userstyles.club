import { base } from '$app/paths';
import type { OAuthClientMetadataInput } from '@atproto/oauth-client-browser';
import {
  CLUB_COLLECTIONS,
  REDIRECT_PATH,
} from './settings';

const scope = [
  'atproto',
  'blob:*/*',
  ...(CLUB_COLLECTIONS.map((collection) => `repo:${collection}`))
].join(' ');

function normalizeBase(basePath: string) {
  if (!basePath || basePath === '/') return '';
  return basePath.replace(/\/$/, '');
}

function normalizeOrigin(origin: string) {
  return origin.replace(/\/$/, '');
}

function appUrl(root: string, path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${root}${normalizedPath}`;
}

export function createClientMetadata(origin: string, basePath = base): OAuthClientMetadataInput {
  const normalizedBase = normalizeBase(basePath);
  const root = `${normalizeOrigin(origin)}${normalizedBase}`;

  return {
    client_id: `${root}/oauth-client-metadata.json`,
    client_name: 'userstyles.club',
    client_uri: root,
    logo_uri: `${root}/favicon.svg`,
    tos_uri: `${root}/`,
    policy_uri: `${root}/`,
    redirect_uris: [appUrl(root, REDIRECT_PATH)],
    scope,
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
    application_type: 'web',
    dpop_bound_access_tokens: true,
  };
}
