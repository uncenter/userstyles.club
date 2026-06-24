import { document, object, record, required, string } from '@atcute/lexicon-doc/builder';

export default document({
  id: 'club.userstyles.alpha.actor.profile',
  defs: {
    main: record({
      key: 'literal:self',
      description: 'A userstyles.club account profile.',
      record: object({
        properties: {
          description: string({ maxGraphemes: 256, maxLength: 2560 }),
          displayName: required(string({ maxGraphemes: 64, maxLength: 640 })),
          createdAt: required(string({ format: 'datetime' })),
        },
      }),
    }),
  },
});
