# Crayon

A colorful userstyles appview, indexing historical and live events from Jetstream. Uses Postgres via Drizzle for storage.

## Routes

- `{root}` — `getUserstyle`, `getUserstyleSourceCode` (usercss source, proxied and cached), `listUserstyles`, `countUserstyles` (list/count take an optional `actor` filter)
- `actor` — `getProfile`, `getProfiles`
- `graph` — `listFollows`, `listFollowers`
- `feed` — `listComments`/`countComments`, `listRatings`/`countRatings` (optional `subject` and/or `author`), `searchUserstyles` (`top`/`latest`/`popular` sort, cursor-paginated), `getFeedback` (comment threads + rating count/average for a subject, each top-level thread carrying its author's rating), `getTimeline` (optional `actor`, scopes to the follow graph)
- `notification` — `listNotifications

## Shortcomings

- No server auth infrastructure yet, and therefore no authenticated/private requests.
- Every actor/author param takes a plain did; handle resolution is left entirely to the client (e.g. via Microcosm's Slingshot).

## Usage

```sh
cp .env.example .env  # set required JETSTREAM_API_KEY
pnpm install
just db init           # brings up postgres and then applies migrations
pnpm dev
```

### Jetstream

Bluesky's Jetstream instances require an API key for replay functionality. Create one at
https://bsky.network/account#api-keys-section-heading and set `JETSTREAM_API_KEY`. `JETSTREAM_SERVICE` defaults to `https://jetstream.us-east.bsky.network`.

`pnpm build && pnpm start` runs the compiled output.
