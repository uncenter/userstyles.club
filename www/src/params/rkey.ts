import type { ParamMatcher } from '@sveltejs/kit';
import { isRecordKey } from '@atcute/lexicons/syntax';

export const match = isRecordKey satisfies ParamMatcher;
