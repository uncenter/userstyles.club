import { document, params, query, required, string } from '@atcute/lexicon-doc/builder';

export default document({
  id: 'club.userstyles.alpha.getUserstyleSourceCode',
  defs: {
    main: query({
      description: "A userstyle's source code.",
      parameters: params({
        properties: {
          actor: required(string({ format: 'did' })),
          rkey: required(string({ format: 'record-key' })),
        },
      }),
      output: {
        encoding: 'text/css',
      },
      errors: [{ name: 'UserstyleNotFound' }, { name: 'SourceUnavailable' }],
    }),
  },
});
