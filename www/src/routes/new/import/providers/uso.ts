import type { ImportProvider } from ".";
import { fetchAsJson, fetchRawFile } from "../fetch.remote";

const USo_SURGE_PATTERN = new URLPattern(
  'https://uso-archive.surge.sh/'
);
const USo_KKX_PATTERN = new URLPattern(
  'https://uso.kkx.one/style/:id'
);

function getStyleId(url: string) {
  const kkx = USo_KKX_PATTERN.exec(url);
  if (kkx) {
    return kkx.pathname.groups.id;
  }

  if (USo_SURGE_PATTERN.test(url)) {
    return new URL(url).searchParams.get('style');
  }

  return null;
}

export default {
  check: (url) => url.startsWith("https://uso-archive.surge.sh/?style=") || url.startsWith("https://uso.kkx.one/style/"),
  import: async (url) => {
    let id = getStyleId(url);

    const data = await fetchAsJson("https://raw.githubusercontent.com/uso-archive/data/flomaster/data/styles/" + id + ".json") as USoArchiveData | undefined;
    if (!data) throw new Error("Failed to fetch style from USo archive");
    const code = await fetchRawFile("https://raw.githubusercontent.com/uso-archive/data/flomaster/data/usercss/" + id + ".user.css");

    // TODO: Support importing previews from URLs.
    // const previewUrls = [data.screenshots.main, ...data.screenshots.additional].filter((screenshot) => screenshot.archived).map((screenshot) => "https://raw.githubusercontent.com/uso-archive/data/flomaster/data/screenshots/" + screenshot.name);

    return {
      title: data.info.name,
      description: data.info.description,
      license: data.info.license,
      sourceCode: code,
    }
  }
} as ImportProvider;

type USoArchiveData = {
  id: number
  info: {
    name: string
    description: string
    additionalInfo: string
    format: string
    category: string
    createdAt: string
    updatedAt: string
    license: string
    author: {
      id: number
      name: string
      homepage: any
      paypalEmail: any
    }
  }
  stats: {
    installs: {
      total: number
      weekly: number
    }
    rating: any
  }
  screenshots: {
    main: {
      name: string
      archived: boolean
    }
    additional: Array<{
      name: string
      archived: boolean
    }>
  }
  obsolete: any
  style: {
    css: string
    settings: Array<any>
  }
  deleteReason: any
};
