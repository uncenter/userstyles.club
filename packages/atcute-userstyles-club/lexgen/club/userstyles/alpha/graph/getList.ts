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
  id: 'club.userstyles.alpha.graph.getList',
  defs: {
    main: query({
      description: "A single list's details plus its saved userstyles, most recently added first.",
      parameters: params({
        properties: {
          actor: required(string({ format: 'did' })),
          rkey: required(string({ format: 'record-key' })),
          limit: integer({ minimum: 1, maximum: 100, default: 50 }),
          cursor: string(),
        },
      }),
      output: {
        encoding: 'application/json',
        schema: object({
          properties: {
            list: required(ref({ ref: 'club.userstyles.alpha.defs#listView' })),
            cursor: string(),
            items: required(
              array({ items: ref({ ref: 'club.userstyles.alpha.defs#listItemView' }) }),
            ),
          },
        }),
      },
      errors: [{ name: 'ListNotFound' }],
    }),
  },
});
