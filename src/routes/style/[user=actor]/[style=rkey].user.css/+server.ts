import type { RequestHandler } from './$types';
import { getUserstyle, removeUpdateUrlFromSource } from '$lib/at';

export const GET: RequestHandler = async ({ params }) => {
  let { user, style } = params;
  let { value: userstyle } = await getUserstyle(user, style);
  const source = userstyle.stripUpdateUrl
    ? removeUpdateUrlFromSource(userstyle.sourceCode)
    : userstyle.sourceCode;
  return new Response(source);
};
