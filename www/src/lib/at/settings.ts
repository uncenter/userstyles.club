import { dev } from '$app/environment';

import * as club from './generated/club';

export const REDIRECT_PATH = '/';
export const HANDLE_RESOLVER_URL = 'https://slingshot.microcosm.blue';

export const CLUB_COLLECTIONS = [club.userstyles.alpha.userstyle.$nsid, club.userstyles.alpha.actor.profile.$nsid, club.userstyles.alpha.graph.rating.$nsid, club.userstyles.alpha.graph.comment.$nsid];

export function getSiteOrigin(): string {
  const envOrigin = import.meta.env.VITE_SITE_ORIGIN;
  if (envOrigin && envOrigin.trim()) return envOrigin.trim();
  if (typeof window !== 'undefined') return window.location.origin;
  return 'https://userstyles.club';
}

export function getSignUpPds() {
  return dev ? 'https://pds.rip/' : 'https://bsky.social/';
}
