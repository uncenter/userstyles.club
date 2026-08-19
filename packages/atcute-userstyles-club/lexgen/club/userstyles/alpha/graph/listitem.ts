import { document, object, record, ref, required, string } from '@atcute/lexicon-doc/builder';

export default document({
  id: 'club.userstyles.alpha.graph.listitem',
  defs: {
    main: record({
      key: 'tid',
      description:
        'A userstyle saved into a list. `list` must be owned by the same repo as this record.',
      record: object({
        properties: {
          list: required(string({ format: 'at-uri' })),
          subject: required(ref({ ref: 'com.atproto.repo.strongRef' })),
          createdAt: required(string({ format: 'datetime' })),
        },
      }),
    }),
  },
});
