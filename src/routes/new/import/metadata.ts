import usercss from 'usercss-meta';

const parser = usercss.createParser({
  mandatoryKeys: [],
});

export function getUsercssMetadata(source: string): {
  title?: string;
  description?: string;
  license?: string;
  homepageUrl?: string;
  version?: string;
} {
  let { metadata } = parser.parse(source.replace(/\r\n/g, '')); // parser errors on \r

  return {
    title: metadata.name as string | undefined,
    description: metadata.description as string | undefined,
    license: metadata.license as string | undefined,
    homepageUrl: metadata.homepageURL as string | undefined,
    version: metadata.version as string | undefined,
  };
}
