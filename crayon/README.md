# Crayon

A colorful Tap-based appview. Uses Postgres via Drizzle for storage.

## Routes

- `{root}` — `getUserstyle`, `getUserstyleSourceCode` (usercss source, proxied and cached), `listUserstyles`, `countUserstyles` (list/count take an optional `actor` filter)
- `actor` — `getProfile`, `getProfiles`
- `graph` — `listFollows`, `listFollowers`
- `feed` — `listComments`/`countComments`, `listRatings`/`countRatings` (optional `subject` and/or `author`), `searchUserstyles` (`top`/`latest`/`popular` sort, cursor-paginated), `getCommentThreads`, `getTimeline` (optional `actor`, scopes to the follow graph)
- `notification` — `listNotifications

## Shortcomings

- No server auth infrastructure yet, and therefore no authenticated/private requests.
- Every actor/author param takes a plain did; handle resolution is left entirely to the client (e.g. via Microcosm's Slingshot).

## Usage

```sh
cp .env.example .env   # then edit as needed
pnpm install
just db init           # brings up postgres and then applies migrations
TAP_URL=http://localhost:2480 pnpm dev
```

`pnpm build && pnpm start` runs the compiled output — the entry point lands at `dist/crayon/src/main.js`, not `dist/main.js` (a consequence of `tsconfig.json`'s `rootDir: ".."`, needed to reach across to `../../src/lib/at/lexicons`).
