import { dev } from '$app/environment';

export const REDIRECT_PATH = '/';

export const SLINGSHOT_URL = 'https://slingshot.microcosm.blue';
export const CONSTELLATION_URL = 'https://constellation.microcosm.blue';

export const CLUB_USERSTYLE_COLLECTION = 'club.userstyles.alpha.userstyle' as const;
export const CLUB_PROFILE_COLLECTION = 'club.userstyles.alpha.actor.profile' as const;
export const CLUB_RATING_COLLECTION = 'club.userstyles.alpha.graph.rating' as const;
export const CLUB_COMMENT_COLLECTION = 'club.userstyles.alpha.graph.comment' as const;

export const CLUB_COLLECTIONS = [CLUB_USERSTYLE_COLLECTION, CLUB_PROFILE_COLLECTION, CLUB_RATING_COLLECTION, CLUB_COMMENT_COLLECTION];

export function getSiteOrigin(): string {
  const envOrigin = import.meta.env.VITE_SITE_ORIGIN;
  if (envOrigin && envOrigin.trim()) return envOrigin.trim();
  if (typeof window !== 'undefined') return window.location.origin;
  return 'https://userstyles.club';
}

export function getSignUpPds() {
  return dev ? 'https://pds.rip/' : 'https://bsky.social/';
}
