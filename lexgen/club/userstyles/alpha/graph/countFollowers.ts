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
  id: 'club.userstyles.alpha.graph.countFollowers',
  defs: {
    main: query({
      description: 'Count the users that follow an actor.',
      parameters: params({
        properties: {
          actor: required(string({ format: 'did' })),
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
    }),
  },
});
