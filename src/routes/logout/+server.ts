import { error, redirect } from '@sveltejs/kit';
import { getOAuthClient } from '$lib/server/oauth';
import { APP_SESSION_COOKIE, destroyAppSession } from '$lib/server/app-session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, cookies, platform }) => {
  if (!platform) error(500, 'Server unavailable.');

  const sessionId = cookies.get(APP_SESSION_COOKIE);
  cookies.delete(APP_SESSION_COOKIE, { path: '/' });

  if (locals.session) {
    await getOAuthClient(platform.env)
      .revoke(locals.session.did)
      .catch(() => {});
  }
  if (sessionId) {
    await destroyAppSession(platform.env.OAUTH_KV, sessionId);
  }

  redirect(302, '/');
};
