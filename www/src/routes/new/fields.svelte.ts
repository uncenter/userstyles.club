import type { UserstyleContent } from '$lib/at';

export interface UserstyleFormFields extends UserstyleContent {
  removeUpdateUrl: boolean;
  trackUpstreamUrl: boolean;
}

const STORAGE_KEY = 'new-userstyle-fields';

const DEFAULTS: UserstyleFormFields = {
  title: '',
  description: undefined,
  license: undefined,
  sourceCode: '',
  upstreamUrl: undefined,
  homepageUrl: undefined,
  removeUpdateUrl: true,
  trackUpstreamUrl: false,
};

export class UserstyleFormState {
  title = $state(DEFAULTS.title);
  description = $state(DEFAULTS.description);
  license = $state(DEFAULTS.license);
  sourceCode = $state(DEFAULTS.sourceCode);
  upstreamUrl = $state(DEFAULTS.upstreamUrl);
  homepageUrl = $state(DEFAULTS.homepageUrl);
  removeUpdateUrl = $state(DEFAULTS.removeUpdateUrl);
  trackUpstreamUrl = $state(DEFAULTS.trackUpstreamUrl);

  constructor() {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) Object.assign(this, JSON.parse(saved));
    } catch {}

    $effect.root(() => {
      $effect(() => {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            title: this.title,
            description: this.description,
            license: this.license,
            sourceCode: this.sourceCode,
            upstreamUrl: this.upstreamUrl,
            homepageUrl: this.homepageUrl,
            removeUpdateUrl: this.removeUpdateUrl,
            trackUpstreamUrl: this.trackUpstreamUrl,
          }),
        );
      });
    });
  }

  reset() {
    Object.assign(this, DEFAULTS);
  }
}

export const fields = new UserstyleFormState();
