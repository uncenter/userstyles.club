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
  id: 'club.userstyles.alpha.feed.getTimeline',
  defs: {
    main: query({
      description:
        'Get the global activity feed, optionally scoped to an actor\'s social graph activity.',
      parameters: params({
        properties: {
          actor: string({
            format: 'did',
            description: 'Filter the feed to accounts this actor follows, rather than the global feed.',
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
            feed: required(
              array({ items: ref({ ref: 'club.userstyles.alpha.defs#feedViewItem' }) }),
            ),
          },
        }),
      },
    }),
  },
});
