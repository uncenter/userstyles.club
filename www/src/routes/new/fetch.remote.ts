import { query } from '$app/server';
import * as v from 'valibot';

export const fetchRawFile = query(v.string(), async (url) => {
  const response = await fetch(url);

  if (response.headers.get('Content-Type') !== 'text/plain; charset=utf-8') {
    throw new Error('Invalid content type');
  }

  if (response.ok) {
    return await response.text();
  }
});

export interface StyleImport {
  title: string | undefined;
  description: string | undefined;
  license: string | undefined;
  homepageUrl: string | undefined;
  code: string | undefined;
}

export const fetchFromUserstylesWorld = query(v.string(), async (id) => {
  let url = `https://userstyles.world/api/style/${id}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch style from userstyles.world');

  const { data } = await response.json();

  let { name: title, description, license, homepage: homepageUrl, code }: Record<string, string | undefined> = data;

  title = title?.trim() || undefined;
  description = description?.trim() || undefined;
  license = license?.trim() || undefined;
  if (license && license === "No License") license = undefined;
  homepageUrl = homepageUrl?.trim() || undefined;
  code = code?.trim() || undefined;

  return { title, description, license, homepageUrl, code } satisfies StyleImport;
});
