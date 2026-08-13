# userstyles.club

The one and only decentralized userstyles publishing club. Built on the AT Protocol.

## Development

Running `nix develop` provides a shell with the full toolchain of Node, pnpm, [`tap`](https://github.com/bluesky-social/indigo/tree/main/cmd/tap/README.md), and `just`/`podman`/`podman-compose` for running Postgres locally. Commands below are `just` recipes (`just --list` to see them all); run `just <recipe>`.

### Frontend

```sh
pnpm install
just app
```

Open `http://127.0.0.1:4173`.

### Crayon (appview)

#### Setup

On macOS (and Windows), Podman needs a VM to run containers in. Run this once for first-time setup.

```sh
podman machine init
podman machine start
```

With Podman set up, install dependencies for Crayon itself and set up the Postgres database.

```sh
cd crayon
pnpm install
just db init   # brings up postgres and then applies migrations
```

#### Usage

You'll likely want to run the entire appview at once, a combination of the Crayon server and the underlying Tap indexer program: `just appview`.

To just run one component of the appview or another, use `just crayon` or `just tap`.

The Crayon/appview instance URL can be configured in the frontend via Settings → Network, or set `VITE_CRAYON_URL`. In development, this defaults to `http://127.0.0.1:8080`, or in production, `https://crayon.userstyles.club`.

### Debugging

Both Tap and crayon expose plain HTTP endpoints you can `curl`.

#### Tap

Tap listens at http://localhost:2480 by default.

```sh
curl http://localhost:2480/stats/repo-count      # total tracked repos
curl http://localhost:2480/stats/record-count    # total tracked records, across every collection tap has synced
curl http://localhost:2480/info/did:plc:example  # state/rev/record count/errors for one repo
```

`/stats/record-count` counts every record Tap has backfilled for every tracked repo (not just userstyles.club collections), so it's typically dominated by unrelated records. To count just userstyles, query Tap's own SQLite DB directly (`tap.db`, created at the repo root by default) instead:

```sh
sqlite3 tap.db "SELECT COUNT(*) FROM repo_records WHERE collection = 'club.userstyles.alpha.userstyle';"
```

#### Crayon

Crayon listens at http://127.0.0.1:8080 by default.

```sh
curl http://127.0.0.1:8080/xrpc/club.userstyles.alpha.countUserstyles
curl 'http://127.0.0.1:8080/xrpc/club.userstyles.alpha.listUserstyles?limit=5'
```
