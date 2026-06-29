import type { PageLoad } from './$types';
import { getUserstyleFeedback } from '$lib/at';

export const load: PageLoad = async ({ parent }) => {
  const { userstyle } = await parent();
  return {
    feedback: await getUserstyleFeedback(userstyle.uri),
  };
};
