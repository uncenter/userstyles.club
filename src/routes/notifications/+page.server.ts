import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
  if (!locals.session) {
    redirect(302, `/login?returnTo=${encodeURIComponent(url.pathname)}`);
  }
};
