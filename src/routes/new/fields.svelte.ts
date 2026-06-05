import { PersistedState } from "runed";

export const fields = new PersistedState(
  'new-userstyle-fields',
  { title: '', description: '', sourceCode: '', importUrl: '' },
  {
    storage: 'session',
    syncTabs: false
  }
);

export type NewUserstyleFields = typeof fields;
