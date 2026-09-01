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
  id: 'club.userstyles.alpha.feed.getFeedback',
  defs: {
    main: query({
      description:
        "Get a subject userstyle's feedback; a list of comment threads and the overall rating count and average.",
      parameters: params({
        properties: {
          subject: required(
            string({ format: 'at-uri', description: 'uri of the subject userstyle' }),
          ),
        },
      }),
      output: {
        encoding: 'application/json',
        schema: object({
          properties: {
            comments: required(
              array({ items: ref({ ref: 'club.userstyles.alpha.defs#commentThreadView' }) }),
            ),
            ratingCount: required(integer()),
            // TODO: Use float type if it becomes a thing?
            ratingAverage: string(),
          },
        }),
      },
    }),
  },
});
