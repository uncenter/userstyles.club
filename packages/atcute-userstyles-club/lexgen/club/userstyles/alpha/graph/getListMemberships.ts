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
  id: 'club.userstyles.alpha.graph.getListMemberships',
  defs: {
    main: query({
      description: "Which of `actor`'s own lists currently contain `subject`.",
      parameters: params({
        properties: {
          actor: required(string({ format: 'did' })),
          subject: required(string({ format: 'at-uri' })),
        },
      }),
      output: {
        encoding: 'application/json',
        schema: object({
          properties: {
            memberships: required(
              array({ items: ref({ ref: 'club.userstyles.alpha.defs#listMembershipView' }) }),
            ),
          },
        }),
      },
    }),
  },
});
