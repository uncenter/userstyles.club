# Lexicons

Add your custom AT Protocol lexicons here.

Included example:

- `com.example.app.note.json` demonstrates a minimal custom collection that is wired into the starter via `src/lib/at/services/notes.ts` and `src/routes/notes/+page.svelte`.

Recommended flow:

1. Create a lexicon file such as `com.example.app.note.json`.
2. Keep the top-level `id` equal to the collection NSID.
3. Add the matching `repo:...` scope to the app metadata.
4. Build a small service module on top of `src/lib/at/records.ts`.

This starter does not force a codegen workflow. It is intended to stay light enough for rapid experiments while still giving you a clear place to grow custom collections.
