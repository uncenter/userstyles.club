import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
  if (locals.session) {
    const returnTo = url.searchParams.get('returnTo');
    redirect(302, returnTo && returnTo.startsWith('/') ? returnTo : '/');
  }

  return { error: url.searchParams.get('error') };
};
