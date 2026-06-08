# userstyles.club

The one and only decentralized userstyles publishing club. Built on the AT Protocol.

## Development

```sh
pnpm install
pnpm run dev
```

Open `http://127.0.0.1:4173`.

## Deploy

1. Push to `main`.
2. Enable GitHub Pages in repository settings using `GitHub Actions`.
3. The workflow computes `BASE_PATH` and `SITE_ORIGIN`.
4. Build output is generated to `build/`.

The build step also generates `static/client-metadata.json`.
