import type { ImportResult } from '..';

import USwImportProvider from './usw';
import USoImportProvider from './uso';
import FileImportProvider from './file';

export type ImportProvider = {
  check: (url: string) => boolean,
  import: (url: string) => Promise<ImportResult>,
}

const providers: Array<ImportProvider> = [
  USwImportProvider,
  USoImportProvider
]

export async function importFromProviders(url: string) {
  for (const provider of providers) {
    if (provider.check(url)) {
      return await provider.import(url);
    }
  }

  return await FileImportProvider.import(url);
}
