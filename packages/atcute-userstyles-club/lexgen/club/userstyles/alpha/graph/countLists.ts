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
  id: 'club.userstyles.alpha.graph.countLists',
  defs: {
    main: query({
      description: "Count an actor's public lists.",
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
