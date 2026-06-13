import { PersistedState } from 'runed';
import type { UserstyleInput } from '$lib/at';

// Subset of UserstyleInput for editable form fields.
export interface UserstyleFormFields extends Omit<UserstyleInput, 'previewImage'> {
  removeUpdateUrl: boolean;
  trackUpstreamUrl: boolean;
}

export type PrimaryFormFields = Omit<UserstyleFormFields, 'upstreamUrl' | 'removeUpdateUrl' | 'trackUpstreamUrl'>;

export const DEFAULT_FIELDS: UserstyleFormFields = {
  title: '',
  description: undefined,
  license: undefined,
  sourceCode: '',
  upstreamUrl: undefined,
  homepageUrl: undefined,
  removeUpdateUrl: true,
  trackUpstreamUrl: false,
};

export const fields = new PersistedState(
  'new-userstyle-fields',
  DEFAULT_FIELDS,
  {
    storage: 'session',
    syncTabs: false
  }
);

export function resetFields() {
  fields.current = { ...DEFAULT_FIELDS };
}
