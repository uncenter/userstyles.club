import { document, object, record, required, string } from '@atcute/lexicon-doc/builder';

export default document({
  id: 'club.userstyles.alpha.graph.follow',
  defs: {
    main: record({
      key: 'tid',
      description: 'A follow toward another user.',
      record: object({
        properties: {
          subject: required(string({ format: 'did' })),
          createdAt: required(string({ format: 'datetime' })),
        },
      }),
    }),
  },
});
