import type { ImportProvider } from ".";
import { fetchRawFile } from "../fetch.remote";
import usercss from 'usercss-meta';

const parser = usercss.createParser({
  mandatoryKeys: [],
});

function normalizeForgeUrl(input: string): string {
  const hosts = ['github.com', 'tangled.org'];

  for (const host of hosts) {
    const pattern = new URLPattern('/:user/:repo/blob/:rest*', `https://${host}`);

    const match = pattern.exec(input);

    if (match) {
      const { user, repo, rest } = match.pathname.groups;
      return `https://${host}/${user}/${repo}/raw/${rest}`;
    }
  }

  return input;
}

export default {
  check: (url) => false,
  import: async (url) => {
    const normalized = normalizeForgeUrl(url);
    const contents = await fetchRawFile(normalized);
    if (!contents) throw new Error('Unable to import from URL');

    let parsed = parser.parse(contents);

    return {
      title: parsed.metadata.name as string | undefined,
      description: parsed.metadata.description as string | undefined,
      license: parsed.metadata.license as string | undefined,
      homepageUrl: parsed.metadata.homepageURL as string | undefined,
      sourceCode: contents,
    };
  }
} as ImportProvider;
