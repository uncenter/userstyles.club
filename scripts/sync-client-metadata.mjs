import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const basePath = (process.env.BASE_PATH ?? '').trim();
const normalizedBase = basePath === '/' ? '' : basePath.replace(/\/$/, '');

const explicitOrigin = (process.env.SITE_ORIGIN ?? '').trim();
const fallbackOrigin = 'https://example.com';
const origin = explicitOrigin || fallbackOrigin;
const root = `${origin}${normalizedBase}`;

const metadata = {
  client_id: `${root}/client-metadata.json`,
  client_name: 'userstyles.club',
  client_uri: root,
  logo_uri: `${root}/favicon.svg`,
  tos_uri: `${root}/`,
  policy_uri: `${root}/`,
  redirect_uris: [`${root}/`],
  scope:
    'atproto blob:*/* repo:club.userstyles.alpha.userstyle repo:club.userstyles.alpha.actor.profile',
  grant_types: ['authorization_code', 'refresh_token'],
  response_types: ['code'],
  token_endpoint_auth_method: 'none',
  application_type: 'web',
  dpop_bound_access_tokens: true
};

mkdirSync(resolve('static'), { recursive: true });
writeFileSync(
  resolve('static/client-metadata.json'),
  JSON.stringify(metadata, null, 2) + '\n',
  'utf8'
);
