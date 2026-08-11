import {
  array,
  document,
  object,
  params,
  query,
  ref,
  required,
  string,
} from '@atcute/lexicon-doc/builder';

export default document({
  id: 'club.userstyles.alpha.graph.getRelationships',
  defs: {
    main: query({
      description:
        "Batch variant of getRelationship: check the follow relationship between `actor` and each of `others`.",
      parameters: params({
        properties: {
          actor: required(string({ format: 'did' })),
          others: required(array({ items: string({ format: 'did' }), maxLength: 25 })),
        },
      }),
      output: {
        encoding: 'application/json',
        schema: object({
          properties: {
            relationships: required(
              array({ items: ref({ ref: 'club.userstyles.alpha.defs#relationshipView' }) }),
            ),
          },
        }),
      },
    }),
  },
});
