import { document, params, query, ref, required, string } from '@atcute/lexicon-doc/builder';

export default document({
  id: 'club.userstyles.alpha.actor.getProfile',
  defs: {
    main: query({
      description: "Get an actor's userstyles.club profile.",
      parameters: params({
        properties: {
          actor: required(string({ format: 'at-identifier' })),
        },
      }),
      output: {
        encoding: 'application/json',
        schema: ref({ ref: 'club.userstyles.alpha.defs#profileView' }),
      },
      errors: [{ name: 'ActorNotFound' }],
    }),
  },
});
