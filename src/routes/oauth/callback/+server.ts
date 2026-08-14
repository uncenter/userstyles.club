import { redirect, error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { getOAuthClient } from '$lib/server/oauth';
import {
  APP_SESSION_COOKIE,
  APP_SESSION_TTL_SECONDS,
  createAppSession,
} from '$lib/server/app-session';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ url, platform, cookies }) => {
  if (!platform) error(500, 'Server unavailable.');

  const result = await getOAuthClient(platform.env)
    .callback(url.searchParams)
    .catch(() => null);

  if (!result) {
    redirect(302, `/login?error=${encodeURIComponent('Sign in failed. Please try again.')}`);
  }

  const { session, state } = result;
  const sessionId = await createAppSession(platform.env.OAUTH_KV, session.did);

  cookies.set(APP_SESSION_COOKIE, sessionId, {
    path: '/',
    httpOnly: true,
    secure: !dev,
    sameSite: 'lax',
    maxAge: APP_SESSION_TTL_SECONDS,
  });

  const returnTo = (state as { returnTo?: string } | undefined)?.returnTo;
  redirect(302, returnTo && returnTo.startsWith('/') ? returnTo : '/');
};
