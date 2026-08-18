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
  id: 'club.userstyles.alpha.feed.searchUserstyles',
  defs: {
    main: query({
      description: 'Search over userstyles, with optional querying and filters.',
      parameters: params({
        properties: {
          query: string({
            description: 'Search terms, matched against title and description fields.',
          }),
          sort: string({
            enum: ['top', 'latest', 'popular'],
            default: 'latest',
            description:
              "Rank by text relevance with 'top'; without a `query`, defaults to 'latest'." +
              "Rank by comment and rating activity via 'popular'.",
          }),
          author: string({ format: 'did' }),
          since: string({
            format: 'datetime',
            description: 'only userstyles created at or after this time',
          }),
          before: string({
            format: 'datetime',
            description: 'only userstyles created before this time',
          }),
          homepage: string({ description: 'substring match against homepageUrl' }),
          upstream: string({ description: 'substring match against upstreamUrl' }),
          limit: integer({ minimum: 1, maximum: 100, default: 25 }),
          cursor: string(),
        },
      }),
      output: {
        encoding: 'application/json',
        schema: object({
          properties: {
            cursor: string(),
            userstyles: required(
              array({ items: ref({ ref: 'club.userstyles.alpha.defs#userstyleView' }) }),
            ),
          },
        }),
      },
    }),
  },
});
