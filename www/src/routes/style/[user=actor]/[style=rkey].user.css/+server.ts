import type { RequestHandler } from './$types';
import { getUserstyle } from '$lib/at';

export const GET: RequestHandler = async ({ params }) => {
  let { user, style } = params;
  let { value: userstyle } = await getUserstyle(user, style);
  return new Response(String(userstyle.sourceCode));
};
