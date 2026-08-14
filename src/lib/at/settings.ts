import { dev } from '$app/environment';
import { preferences } from '../preferences.svelte';

export const REDIRECT_PATH = '/oauth/callback';

const DEFAULT_SLINGSHOT_URL = 'https://slingshot.microcosm.blue';
const DEFAULT_CONSTELLATION_URL = 'https://constellation.microcosm.blue';

export const CLUB_USERSTYLE_COLLECTION = 'club.userstyles.alpha.userstyle' as const;
export const CLUB_PROFILE_COLLECTION = 'club.userstyles.alpha.actor.profile' as const;
export const CLUB_RATING_COLLECTION = 'club.userstyles.alpha.feed.rating' as const;
export const CLUB_COMMENT_COLLECTION = 'club.userstyles.alpha.feed.comment' as const;
export const CLUB_FOLLOW_COLLECTION = 'club.userstyles.alpha.graph.follow' as const;

export const CLUB_COLLECTIONS = [
  CLUB_USERSTYLE_COLLECTION,
  CLUB_PROFILE_COLLECTION,
  CLUB_RATING_COLLECTION,
  CLUB_COMMENT_COLLECTION,
  CLUB_FOLLOW_COLLECTION,
];

export function getSiteOrigin(): string {
  const envOrigin = import.meta.env.VITE_SITE_ORIGIN;
  if (envOrigin && envOrigin.trim()) return envOrigin.trim();
  if (typeof window !== 'undefined') return window.location.origin;
  return 'https://userstyles.club';
}

export function getSignUpPds() {
  return dev ? 'https://pds.rip/' : 'https://bsky.social/';
}

export function isAppviewEnabled(): boolean {
  return preferences.get('isAppviewEnabled');
}

export function getCrayonUrl(): string {
  const custom = preferences.get('customAppviewUrl').trim();
  if (custom) return custom;
  const envUrl = import.meta.env.VITE_CRAYON_URL;
  if (envUrl && envUrl.trim()) return envUrl.trim();
  return dev ? 'http://127.0.0.1:8080' : 'https://crayon.userstyles.club';
}

export function getSlingshotUrl(): string {
  return preferences.get('customSlingshotUrl').trim() || DEFAULT_SLINGSHOT_URL;
}

export function getConstellationUrl(): string {
  return preferences.get('customConstellationUrl').trim() || DEFAULT_CONSTELLATION_URL;
}
