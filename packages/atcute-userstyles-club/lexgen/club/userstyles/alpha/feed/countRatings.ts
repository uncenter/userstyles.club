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
  id: 'club.userstyles.alpha.feed.countRatings',
  defs: {
    main: query({
      description:
        'Count current ratings and their average, optionally filtered by subject and/or author.',
      parameters: params({
        properties: {
          subject: string({ format: 'at-uri', description: 'uri of the subject userstyle' }),
          author: string({ format: 'at-identifier', description: "rater's did" }),
        },
      }),
      output: {
        encoding: 'application/json',
        schema: object({
          properties: {
            count: required(integer()),
            // TODO: Use float type if it becomes a thing?
            average: string(),
          },
        }),
      },
      errors: [{ name: 'ActorNotFound' }],
    }),
  },
});
