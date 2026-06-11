import type { ParamMatcher } from '@sveltejs/kit';
import { isActorIdentifier } from '@atcute/lexicons/syntax';

export const match = isActorIdentifier satisfies ParamMatcher;
