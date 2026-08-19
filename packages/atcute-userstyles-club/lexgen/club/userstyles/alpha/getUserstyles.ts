import {
  array,
  document,
  object,
  params,
  query,
  ref,
  required,
  string,
} from '@atcute/lexicon-doc/builder';

export default document({
  id: 'club.userstyles.alpha.getUserstyles',
  defs: {
    main: query({
      description: 'Get a batch of userstyles.',
      parameters: params({
        properties: {
          uris: required(array({ items: string({ format: 'at-uri' }), maxLength: 100 })),
        },
      }),
      output: {
        encoding: 'application/json',
        schema: object({
          properties: {
            userstyles: required(
              array({ items: ref({ ref: 'club.userstyles.alpha.defs#userstyleView' }) }),
            ),
          },
        }),
      },
    }),
  },
});
