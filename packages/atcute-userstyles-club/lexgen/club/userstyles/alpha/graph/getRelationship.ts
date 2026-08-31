import { document, params, query, ref, required, string } from '@atcute/lexicon-doc/builder';

export default document({
  id: 'club.userstyles.alpha.graph.getRelationship',
  defs: {
    main: query({
      description:
        'Check the follow relationship between two actors: whether `actor` follows `other`, and whether `other` follows `actor` back.',
      parameters: params({
        properties: {
          actor: required(string({ format: 'at-identifier' })),
          other: required(string({ format: 'at-identifier' })),
        },
      }),
      output: {
        encoding: 'application/json',
        schema: ref({ ref: 'club.userstyles.alpha.defs#relationshipView' }),
      },
      errors: [{ name: 'ActorNotFound' }],
    }),
  },
});
