import { document, object, record, required, string } from '@atcute/lexicon-doc/builder';

export default document({
  id: 'club.userstyles.alpha.graph.list',
  defs: {
    main: record({
      key: 'tid',
      description: 'A named, public collection of saved userstyles.',
      record: object({
        properties: {
          name: required(string({ maxGraphemes: 64, minGraphemes: 1, maxLength: 640 })),
          description: string({ maxGraphemes: 300, maxLength: 3000 }),
          createdAt: required(string({ format: 'datetime' })),
          updatedAt: string({ format: 'datetime' }),
        },
      }),
    }),
  },
});
