import { dev } from '$app/environment';

export const REDIRECT_PATH = '/';
export const DOH_RESOLVER = 'https://mozilla.cloudflare-dns.com/dns-query';
export const FOLLOW_COLLECTION = 'app.bsky.graph.follow' as const;
export const BSKY_POST_COLLECTION = 'app.bsky.feed.post' as const;
export const EXAMPLE_NOTE_COLLECTION = 'com.example.app.note' as const;

export function getSiteOrigin(): string {
  const envOrigin = import.meta.env.VITE_SITE_ORIGIN;
  if (envOrigin && envOrigin.trim()) return envOrigin.trim();
  if (typeof window !== 'undefined') return window.location.origin;
  return 'https://example.com';
}

export function getSignUpPds() {
  return dev ? 'https://pds.rip/' : 'https://bsky.social/';
}
