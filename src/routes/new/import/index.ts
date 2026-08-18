import type { UserstyleContent } from '$lib/at';
import type { UserstyleFormState } from '../fields.svelte';
import { getUsercssMetadata } from './metadata';

export type ImportResult = Partial<UserstyleContent>;

export type ImportProvider = {
  check: (url: string) => boolean;
  import: (url: string) => Promise<ImportResult>;
};

// Fill in metadata parsed from the source code, then merge into the given form fields (if empty).
export function applyImportResult(fields: UserstyleFormState, result: ImportResult) {
  if (result.sourceCode) {
    const usercss = getUsercssMetadata(result.sourceCode);
    for (const [key, value] of Object.entries(usercss)) {
      if ((result as any)[key] === undefined && value !== undefined) (result as any)[key] = value;
    }
  }

  for (const key of Object.keys(result) as Array<keyof UserstyleContent>) {
    const value = result[key];
    const current = fields[key];
    if (value && !(typeof current === 'string' ? current.trim() : current))
      (fields as any)[key] = value;
  }
}
