import { untrack } from 'svelte';
import { browser } from '$app/environment';
import type { ActorIdentifier, CanonicalResourceUri, Did, Handle } from '@atcute/lexicons';
import type { ProfileView } from './at';

export type RecentlyVisitedStyle = {
  uri: CanonicalResourceUri;
  title: string;
  authorDid: Did;
  authorHandle: Handle | undefined;
  visitedAt: string;
};

const MAX_RECENTLY_VISITED = 10;

class UserPreferences<T extends Record<string, unknown>> {
  #values = $state<T>({} as T);

  constructor(defaults: T) {
    const values = {} as T;

    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const defaultValue = defaults[key];
      const stored = browser ? localStorage.getItem(key as string) : null;

      if (stored === null) {
        values[key] = defaultValue;
        continue;
      }

      try {
        values[key] = JSON.parse(stored) as T[typeof key];
      } catch {
        values[key] = defaultValue;
      }
    }

    this.#values = values;
  }
  get<K extends keyof T>(key: K): T[K] {
    return this.#values[key];
  }

  set<K extends keyof T>(key: K, value: T[K]) {
    if (browser) localStorage.setItem(key as string, JSON.stringify(value));
    this.#values[key] = value;
  }
}

export const preferences = new UserPreferences({
  appearance: 'system',
  usePermanentUrls: true,
  hasStylusInstalled: false,
  isAppviewEnabled: true,
  // empty string means "use the default" for the three below.
  customAppviewUrl: '',
  customConstellationUrl: '',
  customSlingshotUrl: '',
  // empty string means "never viewed".
  lastViewedNotificationsAt: '',
  recentlyVisitedStyles: [] as RecentlyVisitedStyle[],
  lastTimelineFeedType: 'following' as 'following' | 'global',
});

export function getPreferredActorIdentifier(
  profile: Pick<ProfileView, 'did' | 'handle'>,
): ActorIdentifier {
  // Falls back to the DID regardless of preference when there's no handle to link with.
  if (!profile.handle || preferences.get('usePermanentUrls')) return profile.did;
  return profile.handle;
}

/** "@handle", or the raw DID if the actor has no resolved or verified handle. */
export function formatActorLabel(profile: Pick<ProfileView, 'did' | 'handle'>): string {
  return profile.handle ? `@${profile.handle}` : profile.did;
}

/** Records a style-page visit for the Dashboard's "Recents" list (LRU-capped, most recent first). */
export function recordStyleVisit(entry: Omit<RecentlyVisitedStyle, 'visitedAt'>) {
  untrack(() => {
    const existing = preferences.get('recentlyVisitedStyles').filter((s) => s.uri !== entry.uri);
    preferences.set(
      'recentlyVisitedStyles',
      [{ ...entry, visitedAt: new Date().toISOString() }, ...existing].slice(
        0,
        MAX_RECENTLY_VISITED,
      ),
    );
  });
}
