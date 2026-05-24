import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isActorIdentifier, isRecordKey } from '@atcute/lexicons/syntax';
import { getUserstyle } from '$lib/at';

export const GET: RequestHandler = async ({ params }) => {
  let { user, style } = params;
  let userstyle = await getUserstyle(user, style);
  return new Response(String(userstyle.sourceCode));
};
