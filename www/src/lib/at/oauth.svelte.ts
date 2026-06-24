import { HANDLE_RESOLVER_URL, getSignUpPds, getSiteOrigin } from './settings';
import { createClientMetadata } from './metadata';
import { getProfile, invalidateProfileCaches, type ProfileView } from './services/profiles';
import { BrowserOAuthClient, type OAuthSession } from '@atproto/oauth-client-browser';
import { Client, type DidString } from '@atproto/lex';
import { dev } from '$app/env';

type LoggedOutUser = {
  session?: OAuthSession;
  client?: Client;
  profile?: ProfileView;
  did?: DidString;
};

type LoggedInUser = Required<LoggedOutUser>;

export const user: {
  isInitializing: boolean;
} & (
  | ({
      isLoggedIn: false;
    } & LoggedOutUser)
  | ({
      isLoggedIn: true;
    } & LoggedInUser)
) = $state({
  isInitializing: true,
  isLoggedIn: false,
});

let client: BrowserOAuthClient | undefined;
function getClient() {
  if (!client) {
    client = new BrowserOAuthClient({
      clientMetadata: dev ? undefined : createClientMetadata(getSiteOrigin()),
      handleResolver: HANDLE_RESOLVER_URL,
    });
  }
  return client;
}

export async function initOAuthClient() {
  user.isInitializing = true;

  const result = await getClient().init();

  if (result) {
    const { session } = result;

    user.session = session;
    user.client = new Client(session);
    user.did = session.sub;
    user.isLoggedIn = true;
    user.profile = await getProfile(user.did);
  }

  user.isInitializing = false;
}

export async function login(input: string) {
  input = input.trim();
  if (!input) throw new Error('Please provide a handle or DID.');

  let actor = input.startsWith('did:') ? input : ( // pass DIDs through
    input.includes('.') ? (input.startsWith('@') ? input.slice(1) : input) : // trim @ from handles
    `${input.replace(/^@/, '')}.bsky.social` // otherwise assume a bsky username and complete the handle
  );
  await getClient().signIn(actor);
}

export async function signup() {
  await getClient().signIn(getSignUpPds());
}

export async function logout() {
  if (!user.isLoggedIn) return;

  invalidateProfileCaches(user.did);
  await user.session.signOut();

  Object.assign(user, {
    isLoggedIn: false,
    agent: undefined,
    client: undefined,
    profile: undefined,
    did: undefined,
  });
}
