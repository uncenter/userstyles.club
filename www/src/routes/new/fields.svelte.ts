import { PersistedState } from 'runed';

export const fields = new PersistedState(
  'new-userstyle-fields',
  { title: '', description: '', license: '', sourceCode: '', importUrl: '', homepageUrl: '', upstreamUrl: '', removeUpdateUrl: true },
  {
    storage: 'session',
    syncTabs: false
  }
);

export type NewUserstyleFields = typeof fields;
