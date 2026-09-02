import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { PageLoad } from './$types';

export const prerender = false;

// NOTE: Backwards compatible shim for the rename of /explore to /search.
export const load: PageLoad = ({ url }) => {
  redirect(301, resolve('/search') + url.search);
};
