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
  id: 'club.userstyles.alpha.graph.getLists',
  defs: {
    main: query({
      description: "An actor's public lists, most recently created/updated first.",
      parameters: params({
        properties: {
          actor: required(string({ format: 'did' })),
          limit: integer({ minimum: 1, maximum: 100, default: 50 }),
          cursor: string(),
        },
      }),
      output: {
        encoding: 'application/json',
        schema: object({
          properties: {
            cursor: string(),
            lists: required(array({ items: ref({ ref: 'club.userstyles.alpha.defs#listView' }) })),
          },
        }),
      },
    }),
  },
});
