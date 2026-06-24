import type { ParamMatcher } from '@sveltejs/kit';
import { isRecordKeyString } from '@atproto/lex';

export const match = isRecordKeyString satisfies ParamMatcher;
