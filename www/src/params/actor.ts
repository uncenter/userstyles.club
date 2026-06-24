import type { ParamMatcher } from '@sveltejs/kit';
import { isAtIdentifierString } from '@atproto/syntax';

export const match = isAtIdentifierString satisfies ParamMatcher;
