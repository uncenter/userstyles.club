import {
  document,
  integer,
  object,
  record,
  ref,
  required,
  string,
} from '@atcute/lexicon-doc/builder';

export default document({
  id: 'club.userstyles.alpha.feed.rating',
  defs: {
    main: record({
      key: 'tid',
      description: 'A numerical rating of a userstyle.',
      record: object({
        properties: {
          subject: required(ref({ ref: 'com.atproto.repo.strongRef' })),
          rating: required(integer({ minimum: 1, maximum: 5 })),
          createdAt: required(string({ format: 'datetime' })),
          updatedAt: string({ format: 'datetime' }),
        },
      }),
    }),
  },
});
