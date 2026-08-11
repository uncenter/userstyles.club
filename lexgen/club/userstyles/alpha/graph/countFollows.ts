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
  id: 'club.userstyles.alpha.graph.countFollows',
  defs: {
    main: query({
      description: 'Count the users an actor follows.',
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
