/** Reactive cursor-paginated list state.
 * Cursors are opaque/keyset, not offset-based, so a "load more" model is used rather than page numbers. */
export class PaginatedList<T, C = string> {
  items = $state<T[]>([]);
  cursor = $state<C | undefined>(undefined);
  hasMore = $state(true);
  loading = $state(false);
  loadingMore = $state(false);
  error = $state<string | null>(null);

  constructor(initial?: { items: T[]; cursor?: C }) {
    if (initial) {
      this.items = initial.items;
      this.cursor = initial.cursor;
      this.hasMore = initial.cursor !== undefined;
    }
  }

  async load(
    fetcher: (cursor?: C) => Promise<{ items: T[]; cursor?: C }>,
    opts: { reset?: boolean } = {},
  ) {
    const appending = !opts.reset && this.items.length > 0;
    if (appending) {
      this.loadingMore = true;
    } else {
      this.loading = true;
      this.items = [];
      this.cursor = undefined;
    }
    this.error = null;

    try {
      const page = await fetcher(appending ? this.cursor : undefined);
      this.items = appending ? [...this.items, ...page.items] : page.items;
      this.cursor = page.cursor;
      this.hasMore = page.cursor !== undefined;
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load.';
    } finally {
      this.loading = false;
      this.loadingMore = false;
    }
  }
}
