# Crayon

A colorful userstyles appview, indexing historical and live events from Jetstream. Uses Postgres via Drizzle for storage.

## Roadmap

- Add server auth infrastructure for future authenticated/private requests.

## Usage

```sh
cp .env.example .env  # set required JETSTREAM_API_KEY
pnpm install
just db init           # brings up postgres and then applies migrations
pnpm dev
```

### Jetstream

Bluesky's Jetstream instances require an API key for replay (historical) functionality. Create one at https://bsky.network/account#api-keys-section-heading and set `JETSTREAM_API_KEY` in `.env`. `JETSTREAM_SERVICE` (requires Jetstream v2 for replay) defaults to `https://jetstream.us-east.bsky.network`.

