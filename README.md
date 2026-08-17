# userstyles.club

The one and only decentralized userstyles publishing club. Built on the AT Protocol.

## Development

Running `nix develop` provides a shell with the full toolchain of Node, pnpm, and `just`/`podman`/`podman-compose` for running Postgres locally. Commands below are `just` recipes (`just --list` to see them all); run `just <recipe>`.

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

Run the appview with `just crayon`. The Crayon/appview instance URL can be configured in the frontend via Settings → Network, or set `VITE_CRAYON_URL`. In development, this defaults to `http://127.0.0.1:8080`, or in production, `https://crayon.userstyles.club`.

### Debugging

Crayon exposes plain HTTP endpoints you can `curl`, listening at http://127.0.0.1:8080 by default.

```sh
curl http://127.0.0.1:8080/xrpc/club.userstyles.alpha.countUserstyles
curl 'http://127.0.0.1:8080/xrpc/club.userstyles.alpha.listUserstyles?limit=5'
```
