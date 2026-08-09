set working-directory := 'crayon'

up:
    podman compose up -d --wait
down:
    podman compose down
[confirm("Are you sure you want to delete all Crayon database data?")]
reset:
    podman compose down -v
logs:
    podman compose logs -f

# First-time setup: brings Postgres up (waiting until it's ready) then applies migrations.
# Safe to re-run any time, e.g. after `reset`, since migrations are applied idempotently.
init: up
    pnpm db:migrate
