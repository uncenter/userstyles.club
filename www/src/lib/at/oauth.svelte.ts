import {
  configureOAuth,
  createAuthorizationUrl,
  finalizeAuthorization,
  OAuthUserAgent,
  getSession,
  deleteStoredSession,
} from '@atcute/oauth-browser-client';
import {
  CompositeDidDocumentResolver,
  CompositeHandleResolver,
  DohJsonHandleResolver,
  LocalActorResolver,
  PlcDidDocumentResolver,
  WebDidDocumentResolver,
  WellKnownHandleResolver,
} from '@atcute/identity-resolver';
import { Client } from '@atcute/client';
import { replaceState } from '$app/navigation';
import { SvelteURLSearchParams } from 'svelte/reactivity';
import type { ActorIdentifier, Did } from '@atcute/lexicons';
import { DOH_RESOLVER, REDIRECT_PATH, getSignUpPds } from './settings';
import { getClientMetadata, oauthScope } from './metadata';
import { getProfile, invalidateProfileCaches, type ProfileView } from './services/profiles';

type LoggedOutUser = {
  agent?: OAuthUserAgent;
  client?: Client;
  profile?: ProfileView;
  did?: Did;
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

export async function initClient() {
  user.isInitializing = true;

  const runtime = new URL(window.location.href);
  const isLoopback = ['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(runtime.hostname);
  const redirectOrigin =
    runtime.hostname === 'localhost'
      ? `${runtime.protocol}//127.0.0.1${runtime.port ? `:${runtime.port}` : ''}`
      : runtime.origin;

  const meta = getClientMetadata();
  const clientId = isLoopback
    ? `http://localhost?redirect_uri=${encodeURIComponent(redirectOrigin + REDIRECT_PATH)}&scope=${encodeURIComponent(oauthScope)}`
    : meta.client_id;

  configureOAuth({
    metadata: {
      client_id: clientId,
      redirect_uri: isLoopback ? redirectOrigin + REDIRECT_PATH : meta.redirect_uri,
    },
    identityResolver: new LocalActorResolver({
      handleResolver: new CompositeHandleResolver({
        methods: {
          dns: new DohJsonHandleResolver({ dohUrl: DOH_RESOLVER }),
          http: new WellKnownHandleResolver(),
        },
      }),
      didDocumentResolver: new CompositeDidDocumentResolver({
        methods: {
          plc: new PlcDidDocumentResolver(),
          web: new WebDidDocumentResolver(),
        },
      }),
    }),
  });

  const params = new SvelteURLSearchParams(location.hash.slice(1));
  const did = (localStorage.getItem('current-login') as Did) ?? undefined;

  if (params.size > 0) {
    await finalizeLogin(params, did);
  } else if (did) {
    await resumeSession(did);
  }

  user.isInitializing = false;
}

export async function login(handle: ActorIdentifier) {
  const trimmed = handle.trim();
  if (!trimmed) throw new Error('Please provide a handle or DID.');
  if (trimmed.startsWith('did:')) return startAuthorization(trimmed as ActorIdentifier);
  if (trimmed.includes('.'))
    return startAuthorization(
      (trimmed.startsWith('@') ? trimmed.slice(1) : trimmed) as ActorIdentifier,
    );
  return startAuthorization(`${trimmed.replace(/^@/, '')}.bsky.social` as ActorIdentifier);
}

export async function signup() {
  await startAuthorization();
}

async function startAuthorization(identity?: ActorIdentifier) {
  const authUrl = await createAuthorizationUrl({
    target: identity
      ? { type: 'account', identifier: identity }
      : { type: 'pds', serviceUrl: getSignUpPds() },
    prompt: identity ? undefined : 'create',
    scope: oauthScope,
  });

  window.location.assign(authUrl);
}

export async function logout() {
  if (!user.isLoggedIn) return;

  const did = user.agent.session.info.sub;
  localStorage.removeItem('current-login');
  invalidateProfileCaches(did);

  try {
    await user.agent.signOut();
  } catch {
    deleteStoredSession(did);
  }

  Object.assign(user, {
    isLoggedIn: false,
    agent: undefined,
    client: undefined,
    profile: undefined,
    did: undefined,
  });
}

async function finalizeLogin(params: SvelteURLSearchParams, fallbackDid?: Did) {
  try {
    const { session } = await finalizeAuthorization(params);
    replaceState(location.pathname + location.search, {});

    user.agent = new OAuthUserAgent(session);
    user.client = new Client({ handler: user.agent });
    user.did = session.info.sub;
    user.isLoggedIn = true;

    localStorage.setItem('current-login', session.info.sub);
    user.profile = await getProfile(session.info.sub);
  } catch {
    if (fallbackDid) {
      await resumeSession(fallbackDid);
    }
  }
}

async function resumeSession(did: Did) {
  try {
    const session = await getSession(did, { allowStale: true });
    user.agent = new OAuthUserAgent(session);
    user.client = new Client({ handler: user.agent });
    user.did = session.info.sub;
    user.isLoggedIn = true;

    user.profile = await getProfile(session.info.sub);
  } catch {
    deleteStoredSession(did);
    localStorage.removeItem('current-login');
  }
}
