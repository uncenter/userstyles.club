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
  name?: string;
  desc?: string;
  sourceCode?: string;
}

export const fetchFromUserstylesWorld = query(v.string(), async (id) => {
  let url = `https://userstyles.world/api/style/${id}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch style from userstyles.world');

  const { data } = await response.json();

  return { name: data.name, desc: data.description, sourceCode: data.code };
});
