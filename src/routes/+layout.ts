import type { LayoutLoad } from './$types';
import { getProfile } from '$lib/at';

// The root layout now depends on the per-request session (via +layout.server.ts), so nothing
// under it can be correctly prerendered - a prerendered page would freeze in whatever session
// state (or lack thereof) existed at build time and serve that to every visitor.
export const prerender = false;

export const load: LayoutLoad = async ({ data }) => {
  const { sessionDid } = data;
  if (!sessionDid) return { sessionDid: undefined, profile: undefined };

  const profile = await getProfile(sessionDid).catch(() => undefined);
  return { sessionDid, profile };
};
