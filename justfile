mod db

_default:
    @just --list

# The Svelte frontend application.
app:
    pnpm dev

# The internal Tap indexer (depended on by Crayon).
tap:
    TAP_SIGNAL_COLLECTION=club.userstyles.alpha.actor.profile TAP_COLLECTION_FILTERS="club.userstyles.alpha.*,app.bsky.actor.profile" tap run

# The Crayon appview server (requires Tap separately to index live records/activity).
[working-directory: 'crayon']
crayon: db::init
    TAP_URL=http://localhost:2480 pnpm dev

# The full appview instance, for both Crayon and the internal indexer (Tap).
[parallel]
appview: tap crayon
