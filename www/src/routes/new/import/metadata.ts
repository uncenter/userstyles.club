import usercss from 'usercss-meta';
import type { UserstyleContent } from '$lib/at';

const parser = usercss.createParser({
  mandatoryKeys: [],
});

export function getUsercssMetadata(source: string): Partial<UserstyleContent> {
  let { metadata } = parser.parse(source.replace(/\r\n/g, '')); // parser errors on \r

  return {
    title: metadata.name as string | undefined,
    description: metadata.description as string | undefined,
    license: metadata.license as string | undefined,
    homepageUrl: metadata.homepageURL as string | undefined,
  };
}
