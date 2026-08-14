import { json, error } from '@sveltejs/kit';
import { getOAuthClient } from '$lib/server/oauth';
import type { RequestHandler } from './$types';

// Depends on platform.env (KV/secrets), which aren't available at prerender/build time.
export const prerender = false;

export const GET: RequestHandler = ({ platform }) => {
  if (!platform) error(500, 'Platform bindings unavailable');
  return json(getOAuthClient(platform.env).metadata);
};
