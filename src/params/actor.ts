import type { ParamMatcher } from '@sveltejs/kit';
import type { ActorIdentifier } from '@atcute/lexicons';
import { isActorIdentifier } from '@atcute/lexicons/syntax';

export const match = ((value: string): value is ActorIdentifier => {
  try {
    return isActorIdentifier(decodeURIComponent(value));
  } catch {
    return false;
  }
}) satisfies ParamMatcher;
