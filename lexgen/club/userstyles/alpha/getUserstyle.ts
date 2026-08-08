import { document, params, query, ref, required, string } from '@atcute/lexicon-doc/builder';

export default document({
  id: 'club.userstyles.alpha.getUserstyle',
  defs: {
    main: query({
      description: 'Get a single userstyle by its author and record key.',
      parameters: params({
        properties: {
          actor: required(string({ format: 'did' })),
          rkey: required(string({ format: 'record-key' })),
        },
      }),
      output: {
        encoding: 'application/json',
        schema: ref({ ref: 'club.userstyles.alpha.defs#userstyleView' }),
      },
      errors: [{ name: 'UserstyleNotFound' }],
    }),
  },
});
