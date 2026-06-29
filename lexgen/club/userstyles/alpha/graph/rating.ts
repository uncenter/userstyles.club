import { document, integer, object, record, required, string } from '@atcute/lexicon-doc/builder';

export default document({
  id: 'club.userstyles.alpha.graph.rating',
  defs: {
    main: record({
      key: 'tid',
      description: 'A numerical rating of a userstyle.',
      record: object({
        properties: {
          subject: required(string({ format: 'at-uri' })),
          rating: required(integer({ minimum: 1, maximum: 5 })),
          createdAt: required(string({ format: 'datetime' })),
          updatedAt: string({ format: 'datetime' }),
        },
      }),
    }),
  },
});
