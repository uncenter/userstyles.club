import type { ImportProvider } from ".";
import { fetchAsJson } from "../fetch.remote";

const USw_PATTERN = new URLPattern('/style/:id(\\d+){/:name}?{/}?', 'https://userstyles.world');
// /preview/<id>/<version>t?.<jpeg | webp>
// t indicates thumbnail.
const USw_PREVIEW_PATTERN = new URLPattern('/preview/:id(\\d+)/:version(\\d+t?).:ext(webp|jpeg)', 'https://userstyles.world');

export default {
  check: (url) => USw_PATTERN.test(url),
  import: async (url) => {
    const id = USw_PATTERN.exec(url)!.pathname.groups.id;
    const response = await fetchAsJson(`https://userstyles.world/api/style/${id}`);
    if (!response) throw new Error('Failed to fetch style from userstyles.world');

    let { name: title, description, license, homepage: homepageUrl, preview_url: previewUrl, code: sourceCode }: Record<string, string | undefined> = response.data;

    title = title?.trim() || undefined;
    description = description?.trim() || undefined;
    license = license?.trim() || undefined;
    if (license && license === "No License") license = undefined;
    homepageUrl = homepageUrl?.trim() || undefined;
    sourceCode = sourceCode?.trim() || undefined;

    // TODO: Support importing from preview URLs.
    // let previewUrls = [];
    // if (previewUrl?.trim()) {
    //   let version = USw_PREVIEW_PATTERN.exec(previewUrl)!.pathname.groups.version!.slice(0, -1);
    //   previewUrls.push(`https://userstyles.world/preview/${id}/${version}.webp`);
    // }

    return { title, description, license, homepageUrl, sourceCode };
  }
} as ImportProvider;
