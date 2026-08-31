import {
  array,
  document,
  integer,
  object,
  params,
  query,
  ref,
  required,
  string,
} from '@atcute/lexicon-doc/builder';

export default document({
  id: 'club.userstyles.alpha.listUserstyles',
  defs: {
    main: query({
      description:
        'List userstyles, most recently indexed first. Optionally filter to userstyles from a given author.',
      parameters: params({
        properties: {
          actor: string({ format: 'at-identifier' }),
          limit: integer({ minimum: 1, maximum: 100, default: 50 }),
          cursor: string(),
        },
      }),
      output: {
        encoding: 'application/json',
        schema: object({
          properties: {
            cursor: string(),
            userstyles: required(
              array({ items: ref({ ref: 'club.userstyles.alpha.defs#userstyleView' }) }),
            ),
          },
        }),
      },
      errors: [{ name: 'ActorNotFound' }],
    }),
  },
});
