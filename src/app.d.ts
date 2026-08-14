import type { Did } from '@atcute/lexicons';

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      session: { did: Did } | null;
    }
    // interface PageData {}
    // interface PageState {}
    interface Platform {
      // OAUTH_PRIVATE_KEY_JWK isn't a wrangler.jsonc binding (it's a secret: `wrangler secret put
      // OAUTH_PRIVATE_KEY_JWK`, or `.dev.vars` locally), so `wrangler types` doesn't know about it.
      env: Env & { OAUTH_PRIVATE_KEY_JWK: string };
      ctx: ExecutionContext;
      cf?: CfProperties;
    }
  }
}

import type {} from '@atcute/atproto';
import type {} from '@userstyles.club/atcute';

export {};
