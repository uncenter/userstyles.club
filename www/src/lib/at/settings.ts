import { dev } from '$app/environment';

export const REDIRECT_PATH = '/';
export const DOH_RESOLVER = 'https://mozilla.cloudflare-dns.com/dns-query';
export const CLUB_USERSTYLE_COLLECTION = 'club.userstyles.alpha.userstyle' as const;
export const CLUB_PROFILE_COLLECTION = 'club.userstyles.alpha.actor.profile' as const;
export const CLUB_REVIEW_COLLECTION = 'club.userstyles.alpha.graph.review' as const;

export function getSiteOrigin(): string {
  const envOrigin = import.meta.env.VITE_SITE_ORIGIN;
  if (envOrigin && envOrigin.trim()) return envOrigin.trim();
  if (typeof window !== 'undefined') return window.location.origin;
  return 'https://userstyles.club';
}

export function getSignUpPds() {
  return dev ? 'https://pds.rip/' : 'https://bsky.social/';
}
