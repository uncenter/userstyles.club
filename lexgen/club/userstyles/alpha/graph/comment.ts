import { document, object, record, required, string } from '@atcute/lexicon-doc/builder';

export default document({
  id: 'club.userstyles.alpha.graph.comment',
  defs: {
    main: record({
      key: 'tid',
      description: 'A comment on a userstyle. Can be a reply to another comment.',
      record: object({
        properties: {
          subject: required(string({ format: 'at-uri' })),
          parent: string({ format: 'at-uri' }),
          comment: required(string({ maxGraphemes: 256, maxLength: 2560 })),
          createdAt: required(string({ format: 'datetime' })),
          updatedAt: string({ format: 'datetime' }),
        },
      }),
    }),
  },
});
