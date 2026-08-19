import {
  array,
  document,
  integer,
  object,
  params,
  query,
  ref,
  required,
  string,
} from '@atcute/lexicon-doc/builder';

export default document({
  id: 'club.userstyles.alpha.notification.listNotifications',
  defs: {
    main: query({
      description: "List an actor's notifications, most recent first.",
      parameters: params({
        properties: {
          actor: required(string({ format: 'did' })),
          hydrate: array({
            items: string({ knownValues: ['userstyle'] }),
            maxLength: 5,
            description:
              'related records to embed inline on each notification',
          }),
          limit: integer({ minimum: 1, maximum: 100, default: 50 }),
          cursor: string(),
        },
      }),
      output: {
        encoding: 'application/json',
        schema: object({
          properties: {
            cursor: string(),
            notifications: required(
              array({ items: ref({ ref: 'club.userstyles.alpha.defs#notificationView' }) }),
            ),
          },
        }),
      },
    }),
  },
});
