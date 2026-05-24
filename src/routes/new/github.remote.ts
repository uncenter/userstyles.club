import { query } from '$app/server';
import * as v from 'valibot';

export const fetchRawFile = query(v.string(), async (url) => {
  const response = await fetch(url);

  if (response.ok) {
    return await response.text();
  }
});
