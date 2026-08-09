import { browser } from '$app/environment';
import type { ActorIdentifier } from '@atcute/lexicons';
import type { ProfileView } from './at';

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
});

export function getPreferredActorIdentifier(profile: ProfileView): ActorIdentifier {
  return preferences.get('usePermanentUrls') ? profile.did : profile.handle;
}
