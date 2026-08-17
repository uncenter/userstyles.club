mod db

_default:
    @just --list

# The Svelte frontend application.
app:
    pnpm dev

# The Crayon appview server.
[working-directory: 'crayon']
crayon: db::init
    pnpm dev
