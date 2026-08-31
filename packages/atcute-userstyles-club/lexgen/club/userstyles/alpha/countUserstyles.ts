import {
  document,
  integer,
  object,
  params,
  query,
  required,
  string,
} from '@atcute/lexicon-doc/builder';

export default document({
  id: 'club.userstyles.alpha.countUserstyles',
  defs: {
    main: query({
      description: 'Count userstyles. Optionally filter to userstyles from a given author.',
      parameters: params({
        properties: {
          actor: string({ format: 'at-identifier' }),
        },
      }),
      output: {
        encoding: 'application/json',
        schema: object({
          properties: {
            count: required(integer()),
          },
        }),
      },
      errors: [{ name: 'ActorNotFound' }],
    }),
  },
});
