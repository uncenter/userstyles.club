import { document, object, record, ref, required, string } from '@atcute/lexicon-doc/builder';

export default document({
  id: 'club.userstyles.alpha.feed.comment',
  defs: {
    main: record({
      key: 'tid',
      description: 'A comment on a userstyle. Can be a reply to another comment.',
      record: object({
        properties: {
          subject: required(ref({ ref: 'com.atproto.repo.strongRef' })),
          parent: ref({ ref: 'com.atproto.repo.strongRef' }),
          comment: required(string({ maxGraphemes: 256, maxLength: 2560 })),
          createdAt: required(string({ format: 'datetime' })),
          updatedAt: string({ format: 'datetime' }),
        },
      }),
    }),
  },
});
