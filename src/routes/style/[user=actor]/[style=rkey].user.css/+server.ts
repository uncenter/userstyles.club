import type { RequestHandler } from './$types';
import { getUserstyle, getUserstyleSourceCode, removeSourceCodeUpdateUrl } from '$lib/at';

export const GET: RequestHandler = async ({ params }) => {
  let { user, style } = params;
  let record = await getUserstyle(user, style);
  const sourceCode = await getUserstyleSourceCode(record);
  const processedSourceCode = record.value.ignoreUpdateUrl ? removeSourceCodeUpdateUrl(sourceCode) : sourceCode;
  return new Response(processedSourceCode);
};
