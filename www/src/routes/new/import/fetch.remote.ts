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

export const fetchAsJson = query(v.string(), async (url) => {
  const response = await fetch(url);

  if (response.ok) {
    return await response.json();
  }
});
