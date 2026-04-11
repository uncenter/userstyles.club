# sveltekit-atproto-static-starter

SvelteKit starter for building distinctive web apps on AT Protocol.

This template is intentionally client-only and static-first. It gives you real browser OAuth, public Bluesky reads, authenticated record writes, direct PDS reads, and reusable ATProto service modules so you can build an app around your own lexicons and interaction model.

AT Protocol is the backend. There is no server in this repo.

## What this starter includes

- Browser OAuth with `@atcute/oauth-browser-client`
- Public reads from Bluesky APIs
- DID and PDS resolution for direct repo access
- Typed-ish service modules for profiles, follows, posts, custom notes, and repo inspection
- Generic repo record helpers for your own collections
- Static hosting setup for GitHub Pages
- Example routes that show how to compose the reusable AT layer into an app

## Quick start

```sh
npm install
npm run dev
```

Open `http://127.0.0.1:4173`.

## Starter architecture

The app is organized so developers can keep the included routes, replace them, or build entirely new experiences on the same AT layer.

### Core layers

- `src/lib/at/oauth.svelte.ts`
  Browser OAuth bootstrap, session restore, and current-user state
- `src/lib/at/auth.ts`
  Authenticated session helpers for write operations
- `src/lib/at/client.ts`
  Public client and per-DID PDS clients
- `src/lib/at/did.ts`
  Handle resolution and DID document lookup
- `src/lib/at/records.ts`
  Generic CRUD helpers for custom collections

### Reusable services

- `src/lib/at/services/profiles.ts`
  Public profile reads and lightweight caching
- `src/lib/at/services/follows.ts`
  Follow state lookup and follow/unfollow writes
- `src/lib/at/services/posts.ts`
  Post creation for `app.bsky.feed.post`
- `src/lib/at/services/notes.ts`
  Example custom-collection CRUD for `com.example.app.note`
- `src/lib/at/services/repo.ts`
  Repo description and collection preview loading

### UI layer

- `src/routes/*`
  Example pages that consume the ATProto service layer rather than issuing raw XRPC calls inline

## Included routes

- `/` home
- `/login` sign in / sign up
- `/search` actor search
- `/profile/[id]` profile + follow button
- `/post` publish a basic Bluesky post
- `/notes` custom collection example for `com.example.app.note`
- `/repo` inspect your repo collections and open records in `pdsls.dev`

## Build your own app on top of this

For most ATProto apps, the central workflow is:

1. Authenticate a user in the browser.
2. Define one or more custom collections.
3. Read public data through Bluesky/public clients.
4. Write user-owned records through authenticated repo helpers.
5. Shape the UI around your app concept rather than Bluesky’s default product model.

That means you should treat the bundled routes as examples, not constraints.

Good use cases for this starter:

- social tools with custom collections
- personal publishing apps
- community curation tools
- lightweight dashboards over repo data
- experiments that blend public reads with user-owned writes

## Guide: add your own lexicon

1. Pick a reverse-DNS NSID such as `com.yourdomain.app.note`.
2. Add your lexicon under `lexicons/` with the same `id`.
3. Add `repo:com.yourdomain.app.note` to the app scope.
4. Use `createRecord`, `putRecord`, `getRecord`, and `listRecordsForRepo` from `src/lib/at/records.ts`.
5. Add a small service module for app-specific operations instead of calling XRPC directly from routes.

This starter includes a complete reference implementation:

- lexicon: `lexicons/com.example.app.note.json`
- service module: `src/lib/at/services/notes.ts`
- route: `src/routes/notes/+page.svelte`

Example record shape:

```ts
await createRecord('com.yourdomain.app.note', {
  $type: 'com.yourdomain.app.note',
  text: 'hello world',
  createdAt: new Date().toISOString()
});
```

Recommended pattern:

- keep low-level protocol code in `src/lib/at`
- add app-specific domain logic in `src/lib/your-app`
- keep routes thin and focused on UI state

## Reference example: custom notes collection

The included notes example is the core extension pattern for this starter.

It shows how to:

- define a custom record collection with a lexicon
- add the matching repo scope to OAuth metadata
- expose app-facing helpers like `listMyNotes`, `createNote`, and `deleteNote`
- build a route that uses those helpers instead of raw XRPC calls

If you are building your own app concept, this is usually the first pattern to copy and adapt.

## AT Protocol conventions in this starter

- OAuth metadata is generated at build time into `static/client-metadata.json`
- Local OAuth uses loopback redirect with `127.0.0.1`
- Default write scopes are minimal for included features
- The sample notes collection is scoped as `repo:com.example.app.note`
- DID-based repo reads resolve the actor’s PDS before direct repo access
- Write records include `$type` and RFC3339 `createdAt`

## Deploy to GitHub Pages

1. Push to `main`.
2. Enable GitHub Pages in repository settings using `GitHub Actions`.
3. The workflow computes `BASE_PATH` and `SITE_ORIGIN`.
4. Build output is generated to `build/`.

The build step also generates `static/client-metadata.json`.

## Mirror to Tangled

This repo also includes a GitHub Actions workflow that mirrors `main` to Tangled:

- workflow: `.github/workflows/mirror-tangled.yml`
- remote: `git@tangled.org:charlebois.info/sveltekit-atproto-starter`

To enable it, add this GitHub Actions secret in your repository settings:

- `TANGLED_SSH_KEY`
  An SSH private key that has push access to the Tangled repo

Once that secret is set, every push to `main` on GitHub will mirror the same commit to Tangled.

## Scripts

- `npm run dev` start local dev server
- `npm run check` run Svelte and TypeScript checks
- `npm run build` generate client metadata and build the static site
- `npm run preview` preview the production build

## Why this starter is opinionated

ATProto apps usually need the same difficult pieces:

- browser-safe OAuth
- handle and DID resolution
- repo record writes
- public reads
- collection-driven app data

This repo keeps those pieces in place so you can spend time on the actual experience you want to invent.
