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
  id: 'club.userstyles.alpha.feed.countComments',
  defs: {
    main: query({
      description: 'Count comments, optionally filtered by subject and/or author.',
      parameters: params({
        properties: {
          subject: string({ format: 'at-uri', description: 'uri of the subject userstyle' }),
          author: string({ format: 'at-identifier', description: "comment author's did" }),
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
      errors: [{ name: 'ActorNotFound' }],
    }),
  },
});
