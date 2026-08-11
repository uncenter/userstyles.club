import type { ClubUserstylesAlphaDefs } from '$lib/at/lexicons';

type MozDocumentFunction = ClubUserstylesAlphaDefs.MozDocumentFunction;

export function extractDomains(fns: MozDocumentFunction[]): string[] {
  const domains = new Set<string>();

  for (const fn of fns) {
    if (fn.name === 'domain') {
      domains.add(fn.value);
    } else if (fn.name === 'url' || fn.name === 'url-prefix') {
      try {
        domains.add(new URL(fn.value).hostname);
      } catch {
        // not a parseable URL, skip
      }
    }
  }

  return [...domains];
}
