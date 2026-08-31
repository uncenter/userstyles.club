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
  id: 'club.userstyles.alpha.actor.getProfiles',
  defs: {
    main: query({
      description: 'Get userstyles.club profiles for a batch of actors.',
      parameters: params({
        properties: {
          actors: required(array({ items: string({ format: 'at-identifier' }), maxLength: 25 })),
        },
      }),
      output: {
        encoding: 'application/json',
        schema: object({
          properties: {
            profiles: required(
              array({ items: ref({ ref: 'club.userstyles.alpha.defs#profileView' }) }),
            ),
          },
        }),
      },
    }),
  },
});
