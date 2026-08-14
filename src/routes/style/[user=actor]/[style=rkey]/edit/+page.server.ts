import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { ActorIdentifier } from '@atcute/lexicons';
import { resolveToDid } from '$lib/at/client';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url }) => {
  if (!locals.session) {
    redirect(302, `/login?returnTo=${encodeURIComponent(url.pathname)}`);
  }

  const ownerDid = await resolveToDid(params.user as ActorIdentifier);
  if (locals.session.did !== ownerDid) {
    redirect(302, resolve('/style/[user=actor]/[style=rkey]', params));
  }
};
