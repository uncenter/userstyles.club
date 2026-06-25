import { blob, document, object, record, required, string } from '@atcute/lexicon-doc/builder';

export default document({
  id: 'club.userstyles.alpha.userstyle',
  defs: {
    main: record({
      key: 'tid',
      description: 'A UserCSS userstyle.',
      record: object({
        properties: {
          title: required(string({ maxGraphemes: 140, minGraphemes: 1 })),
          description: string({ maxGraphemes: 300 }),
          sourceCode: required(string()),
          previewImage: blob({ accept: ['image/*'], maxSize: 1000000 }),
          license: string({ maxLength: 100 }),
          upstreamUrl: string({ format: 'uri' }),
          homepageUrl: string({ format: 'uri' }),
          createdAt: required(string({ format: 'datetime' })),
          updatedAt: string({ format: 'datetime' }),
        },
      }),
    }),
  },
});
