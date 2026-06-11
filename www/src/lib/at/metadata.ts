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

type ClientMetadata = {
  client_id: string;
  client_name: string;
  client_uri: string;
  logo_uri: string;
  tos_uri: string;
  policy_uri: string;
  redirect_uris: string[];
  scope: string;
  grant_types: string[];
  response_types: string[];
  token_endpoint_auth_method: 'none';
  application_type: 'web';
  dpop_bound_access_tokens: true;
};

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

export function createClientMetadata(origin: string, basePath = base): ClientMetadata {
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
    dpop_bound_access_tokens: true
  };
}

export function getClientMetadata() {
  const metadata = createClientMetadata(getSiteOrigin());

  return {
    client_id: metadata.client_id,
    redirect_uri: metadata.redirect_uris[0],
    scope: metadata.scope
  };
}

export const oauthScope = scope;
