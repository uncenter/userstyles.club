import type { Did } from '@atcute/lexicons';
import type { ProfileView } from './services/profiles';

type UserState =
  | { isLoggedIn: false; did?: undefined; profile?: undefined }
  | { isLoggedIn: true; did: Did; profile?: ProfileView };

/** Reactive reflection of the server-side session (see `src/routes/+layout.server.ts`/`+layout.ts`) - never holds tokens or an agent, purely for UI. */
export const user: UserState = $state({ isLoggedIn: false });

/** Syncs `user` from server-provided session data. Called from the root layout whenever `data` changes. */
export function setUser(session: { did: Did; profile?: ProfileView } | undefined) {
  if (session) {
    Object.assign(user, { isLoggedIn: true, did: session.did, profile: session.profile });
  } else {
    Object.assign(user, { isLoggedIn: false, did: undefined, profile: undefined });
  }
}
