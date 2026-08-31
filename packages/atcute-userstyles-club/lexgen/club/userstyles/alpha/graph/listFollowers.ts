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
  id: 'club.userstyles.alpha.graph.listFollowers',
  defs: {
    main: query({
      description: 'List the users that follow an actor, most recent first.',
      parameters: params({
        properties: {
          actor: required(string({ format: 'at-identifier' })),
          limit: integer({ minimum: 1, maximum: 100, default: 50 }),
          cursor: string(),
        },
      }),
      output: {
        encoding: 'application/json',
        schema: object({
          properties: {
            cursor: string(),
            followers: required(
              array({ items: ref({ ref: 'club.userstyles.alpha.defs#followView' }) }),
            ),
          },
        }),
      },
      errors: [{ name: 'ActorNotFound' }],
    }),
  },
});
