# userstyles.club

The one and only decentralized userstyles publishing club. Built on the AT Protocol.

## Development

```sh
pnpm install
pnpm run dev
```

Open `http://127.0.0.1:4173`.

## Todo

Frontend still reads mostly via direct-PDS calls and constellation backlinks; `crayon` replaces both.

### Migration

- [ ] `/explore`: add cursor pagination to `listAllUserstyles`
- [ ] Comments: replace `listCommentsForStyle` + client-side `getCommentThreads` tree-builder with crayon's `feed.getCommentThreads` (the latter returns a flat array instead of the current nested tree approach `Comments.svelte`/`CommentItem.svelte` expect, so those need rework too)
- [ ] Ratings: replace `listRatingsForStyle` + client-computed average with `feed.listRatings`/`feed.countRatings`
- [ ] `getUserstyleFeedback`: drop constellation `Promise.all` once the above land
- [ ] Listings (explore cards, profile page): use `userstyleView.commentCount`/`ratingCount` instead of fetching feedback per style

### Features (new/unblocked)

- [ ] Following: follow/unfollow buttons, counts, indicators + followers/following lists (`graph.listFollows`/`listFollowers`)
- [ ] Real activity feed via `feed.getTimeline` (global or following-scoped)
- [ ] Search page and/or search bar (header?) via `feed.searchUserstyles` (query, `top`/`latest`/`popular` sort, filters, cursor)
- [ ] Notifications via `notification.listNotifications`/`updateNotificationsSeen` (unauthenticated, add page + header notification tray and unread indicator)
- [ ] Surface `mozDocumentFunctions`/`isConfigurable` on listings (domains a style applies to, a "configurable" badge)
- [ ] `popular` sort/browsing on `/explore`
