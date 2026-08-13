import type { LayoutServerLoad } from './$types';
import type { Did } from '@atcute/lexicons';
import { SESSION_HINT_COOKIE } from '$lib/constants';

export const load: LayoutServerLoad = ({ cookies }) => {
  return {
    sessionHintDid: cookies.get(SESSION_HINT_COOKIE) as Did | undefined,
  };
};
