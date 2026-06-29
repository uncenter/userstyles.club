import type { UserstyleContent } from '$lib/at';

export type ImportResult = Partial<UserstyleContent>;

export type ImportProvider = {
  check: (url: string) => boolean;
  import: (url: string) => Promise<ImportResult>;
};
