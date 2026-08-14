import { command, getRequestEvent } from '$app/server';
import { isDid } from '@atcute/lexicons/syntax';
import type { ActorIdentifier, Handle } from '@atcute/lexicons';
import { getOAuthClient } from '$lib/server/oauth';
import { getSignUpPds } from './settings';

// A remote command's own request URL is its internal RPC endpoint, not the page that invoked it,
// so the caller (LoginForm.svelte) tells us where to return to via `returnTo`.
function safeReturnTo(returnTo: string | undefined): string {
  return returnTo && returnTo.startsWith('/') ? returnTo : '/';
}

function normalizeActor(input: string): ActorIdentifier {
  const trimmed = input.trim().replace(/^@/, '');
  return (trimmed.includes('.') ? trimmed : `${trimmed}.bsky.social`) as Handle;
}

/** Starts the login flow for `handle`, returning the PDS/entryway authorization URL to navigate to. */
export const login = command(
  'unchecked',
  async ({ handle, returnTo }: { handle: string; returnTo?: string }): Promise<string> => {
    const input = handle.trim();
    if (!input) throw new Error('Please provide a handle or DID.');

    const { platform } = getRequestEvent();
    if (!platform) throw new Error('Server unavailable.');

    const identifier = isDid(input) ? (input as ActorIdentifier) : normalizeActor(input);

    const { url: authUrl } = await getOAuthClient(platform.env).authorize({
      target: { type: 'account', identifier },
      state: { returnTo: safeReturnTo(returnTo) },
    });

    return authUrl.toString();
  },
);

/** Starts the sign-up flow on the default PDS, returning the authorization URL to navigate to. */
export const signup = command(
  'unchecked',
  async (returnTo?: string): Promise<string> => {
    const { platform } = getRequestEvent();
    if (!platform) throw new Error('Server unavailable.');

    const { url: authUrl } = await getOAuthClient(platform.env).authorize({
      target: { type: 'pds', serviceUrl: getSignUpPds() },
      prompt: 'create',
      state: { returnTo: safeReturnTo(returnTo) },
    });

    return authUrl.toString();
  },
);
