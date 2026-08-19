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
  id: 'club.userstyles.alpha.feed.listRatings',
  defs: {
    main: query({
      description: 'List ratings, optionally filtered by subject and/or author.',
      parameters: params({
        properties: {
          subject: string({ format: 'at-uri', description: 'uri of the subject userstyle' }),
          author: string({ format: 'did', description: "rater's did" }),
          hydrate: array({
            items: string({ knownValues: ['userstyle'] }),
            maxLength: 5,
            description:
              'related records to embed inline on each rating view',
          }),
          limit: integer({ minimum: 1, maximum: 100, default: 50 }),
          cursor: string(),
        },
      }),
      output: {
        encoding: 'application/json',
        schema: object({
          properties: {
            cursor: string(),
            ratings: required(
              array({ items: ref({ ref: 'club.userstyles.alpha.defs#ratingView' }) }),
            ),
          },
        }),
      },
    }),
  },
});
