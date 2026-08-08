import { array, document, object, params, query, ref, required, string } from '@atcute/lexicon-doc/builder';

export default document({
  id: 'club.userstyles.alpha.feed.getCommentThreads',
  defs: {
    main: query({
      description:
        'Get every comment on a subject userstyle, flattened across every top-level thread and ordered so that each node follows its parent.',
      parameters: params({
        properties: {
          subject: required(string({ format: 'at-uri', description: 'uri of the subject userstyle' })),
        },
      }),
      output: {
        encoding: 'application/json',
        schema: object({
          properties: {
            comments: required(
              array({ items: ref({ ref: 'club.userstyles.alpha.defs#commentThreadView' }) }),
            ),
          },
        }),
      },
    }),
  },
});
