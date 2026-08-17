import { and, desc, eq, getTableColumns, inArray, isNull, sql, type SQL } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { PgTable } from 'drizzle-orm/pg-core';
import postgres from 'postgres';

import * as schema from './schema.ts';
import {
  comments,
  follows,
  ingestCursor,
  notifications,
  profiles,
  ratings,
  sourceCode,
  userstyles,
} from './schema.ts';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/crayon';

const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export type NewUserstyle = typeof userstyles.$inferInsert;
export type NewProfile = typeof profiles.$inferInsert;
export type NewRating = typeof ratings.$inferInsert;
export type NewComment = typeof comments.$inferInsert;
export type NewFollow = typeof follows.$inferInsert;
export type NewNotification = typeof notifications.$inferInsert;

const { searchVector: _searchVector, ...userstyleColumns } = getTableColumns(userstyles);
export type UserstyleRow = Pick<typeof userstyles.$inferSelect, keyof typeof userstyleColumns>;

const { cid: _profileCid, ...profileColumns } = getTableColumns(profiles);
export type ProfileRow = Pick<typeof profiles.$inferSelect, keyof typeof profileColumns>;

const {
  rkey: _ratingRkey,
  subjectCid: _ratingSubjectCid,
  ...ratingColumns
} = getTableColumns(ratings);
export type RatingRow = Pick<typeof ratings.$inferSelect, keyof typeof ratingColumns>;

const {
  rkey: _commentRkey,
  subjectCid: _commentSubjectCid,
  parentCid: _commentParentCid,
  deletedAt: commentDeletedAt,
  ...commentColumns
} = getTableColumns(comments);
export type CommentRow = Pick<typeof comments.$inferSelect, keyof typeof commentColumns>;

const { recipientDid: _notificationRecipientDid, ...notificationColumns } =
  getTableColumns(notifications);
export type NotificationRow = Pick<
  typeof notifications.$inferSelect,
  keyof typeof notificationColumns
>;

export interface FollowRow {
  uri: string;
  did: string;
  createdAt: string;
  indexedAt: number;
}

const { cid: _followCid, rkey: _followRkey, ...followActivityColumns } = getTableColumns(follows);
export type FollowActivityRow = Pick<
  typeof follows.$inferSelect,
  keyof typeof followActivityColumns
>;

/** Filter to a subject userstyle and/or to an  `author` did. */
export interface SubjectAuthorFilter {
  subjectUri?: string;
  author?: string;
}

/** Builds an object mapping each of `columns` to its own `excluded.<db_column_name>`, for usage with `onConflictDoUpdate`. */
function conflictUpdateColumns<
  TTable extends PgTable,
  K extends keyof TTable['_']['columns'] & string,
>(table: TTable, columns: readonly K[]): Record<K, SQL> {
  const tableColumns = getTableColumns(table);
  return Object.fromEntries(
    columns.map((column) => [column, sql.raw(`excluded.${tableColumns[column].name}`)]),
  ) as Record<K, SQL>;
}

/** Last Jetstream event seq successfully processed, or undefined if the indexer has never run. */
export async function getIngestCursor(): Promise<number | undefined> {
  const [row] = await db
    .select({ seq: ingestCursor.seq })
    .from(ingestCursor)
    .where(eq(ingestCursor.id, 1));
  return row?.seq;
}

export async function saveIngestCursor(seq: number): Promise<void> {
  await db
    .insert(ingestCursor)
    .values({ id: 1, seq })
    .onConflictDoUpdate({ target: ingestCursor.id, set: { seq } });
}

export async function upsertUserstyle(r: NewUserstyle): Promise<void> {
  const [previous] = await db
    .select({ sourceCodeCid: userstyles.sourceCodeCid })
    .from(userstyles)
    .where(eq(userstyles.uri, r.uri));

  await db
    .insert(userstyles)
    .values(r)
    .onConflictDoUpdate({
      target: userstyles.uri,
      set: conflictUpdateColumns(userstyles, [
        'cid',
        'title',
        'description',
        'license',
        'upstreamUrl',
        'homepageUrl',
        'ignoreUpdateUrl',
        'sourceCodeCid',
        'previewImageCid',
        'updatedAt',
        'indexedAt',
        'mozDocumentFunctions',
        'userCssVars',
      ]),
    });

  // Evict the now-superseded blob if orphaned by an edit that now points at new source code.
  if (previous && previous.sourceCodeCid !== r.sourceCodeCid) {
    await evictOrphanedSourceCode(previous.sourceCodeCid);
  }
}

export async function deleteUserstyle(uri: string): Promise<void> {
  const [deleted] = await db
    .delete(userstyles)
    .where(eq(userstyles.uri, uri))
    .returning({ sourceCodeCid: userstyles.sourceCodeCid });
  if (deleted) await evictOrphanedSourceCode(deleted.sourceCodeCid);
}

/** Deletes the cached source for `cid`, unless some other userstyle still/also references it. */
async function evictOrphanedSourceCode(cid: string): Promise<void> {
  const [stillReferenced] = await db
    .select({ uri: userstyles.uri })
    .from(userstyles)
    .where(eq(userstyles.sourceCodeCid, cid))
    .limit(1);
  if (!stillReferenced) {
    await db.delete(sourceCode).where(eq(sourceCode.cid, cid));
  }
}

export async function getDbCachedSourceCode(cid: string): Promise<string | null> {
  const [row] = await db
    .select({ content: sourceCode.content })
    .from(sourceCode)
    .where(eq(sourceCode.cid, cid));
  return row?.content ?? null;
}

export async function setDbCachedSourceCode(
  cid: string,
  content: string,
  cachedAt: number,
): Promise<void> {
  await db.insert(sourceCode).values({ cid, content, cachedAt }).onConflictDoNothing();
}

export async function upsertProfile(r: NewProfile): Promise<void> {
  await db
    .insert(profiles)
    .values(r)
    .onConflictDoUpdate({
      target: profiles.did,
      set: conflictUpdateColumns(profiles, ['cid', 'description', 'indexedAt']),
    });
}

export async function deleteProfile(did: string): Promise<void> {
  await db.delete(profiles).where(eq(profiles.did, did));
}

async function incrementCommentCount(subjectUri: string, delta: number): Promise<void> {
  await db
    .update(userstyles)
    .set({ commentCount: sql`${userstyles.commentCount} + ${delta}` })
    .where(eq(userstyles.uri, subjectUri));
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function adjustRatingSummary(
  tx: Tx,
  subjectUri: string,
  countDelta: number,
  sumDelta: number,
): Promise<void> {
  if (countDelta === 0 && sumDelta === 0) return;
  await tx
    .update(userstyles)
    .set({
      ratingCount: sql`${userstyles.ratingCount} + ${countDelta}`,
      ratingSum: sql`${userstyles.ratingSum} + ${sumDelta}`,
    })
    .where(eq(userstyles.uri, subjectUri));
}

/** Upserts a rating record and keeps userstyles.rating_count/rating_sum (the "current ratings" cache read by getRatingSummary)
 *  in sync via a point lookup + delta. */
export async function upsertRating(r: NewRating): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [previous] = await tx
      .select({ uri: ratings.uri, rkey: ratings.rkey, rating: ratings.rating })
      .from(ratings)
      .where(and(eq(ratings.subjectUri, r.subjectUri), eq(ratings.did, r.did)))
      .orderBy(desc(ratings.rkey))
      .limit(1);

    const [row] = await tx
      .insert(ratings)
      .values(r)
      .onConflictDoUpdate({
        target: ratings.uri,
        set: conflictUpdateColumns(ratings, ['cid', 'rating', 'updatedAt', 'indexedAt']),
      })
      .returning({ inserted: sql<boolean>`(xmax = 0)` });

    if (!previous) {
      await adjustRatingSummary(tx, r.subjectUri, 1, r.rating);
    } else if (previous.uri === r.uri || r.rkey > previous.rkey) {
      // Editing the current record in place, or a new record superseding it.
      await adjustRatingSummary(tx, r.subjectUri, 0, r.rating - previous.rating);
    }
    // Otherwise this write's rkey is older than the rater's existing current record (an
    // out-of-order/backfill event for an already-superseded rating) -> leave the cache untouched.

    return row?.inserted ?? false;
  });
}

export async function deleteRating(uri: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [deleted] = await tx.delete(ratings).where(eq(ratings.uri, uri)).returning({
      subjectUri: ratings.subjectUri,
      did: ratings.did,
      rating: ratings.rating,
      rkey: ratings.rkey,
    });
    if (!deleted) return;

    const [remaining] = await tx
      .select({ rating: ratings.rating, rkey: ratings.rkey })
      .from(ratings)
      .where(and(eq(ratings.subjectUri, deleted.subjectUri), eq(ratings.did, deleted.did)))
      .orderBy(desc(ratings.rkey))
      .limit(1);

    // If a newer record already existed for this rater, `deleted` had already been superseded
    // and wasn't part of the current-ratings aggregate.
    if (remaining && remaining.rkey > deleted.rkey) return;

    if (remaining) {
      await adjustRatingSummary(tx, deleted.subjectUri, 0, remaining.rating - deleted.rating);
    } else {
      await adjustRatingSummary(tx, deleted.subjectUri, -1, -deleted.rating);
    }
  });
}

export async function upsertFollow(r: NewFollow): Promise<boolean> {
  const [row] = await db
    .insert(follows)
    .values(r)
    .onConflictDoUpdate({
      target: follows.uri,
      set: conflictUpdateColumns(follows, ['cid', 'indexedAt']),
    })
    .returning({ inserted: sql<boolean>`(xmax = 0)` });
  return row?.inserted ?? false;
}

export async function deleteFollow(uri: string): Promise<void> {
  await db.delete(follows).where(eq(follows.uri, uri));
}

export async function createNotification(n: NewNotification): Promise<void> {
  await db
    .insert(notifications)
    .values(n)
    .onConflictDoNothing({ target: [notifications.recordUri, notifications.recipientDid] });
}

export async function upsertComment(r: NewComment): Promise<boolean> {
  const [row] = await db
    .insert(comments)
    .values({ ...r, deletedAt: null })
    .onConflictDoUpdate({
      target: comments.uri,
      set: {
        ...conflictUpdateColumns(comments, ['cid', 'comment', 'updatedAt', 'indexedAt']),
        deletedAt: null,
      },
    })
    .returning({ inserted: sql<boolean>`(xmax = 0)` });
  const inserted = row?.inserted ?? false;
  if (inserted) await incrementCommentCount(r.subjectUri, 1);
  return inserted;
}

/** Tombstones rather than deletes, so thread structure (replies to this comment) survives.
 * Only decrements the count the first time a given uri is tombstoned, so a replayed delete event doesn't double-decrement. */
export async function deleteComment(uri: string, deletedAt: number): Promise<void> {
  const [row] = await db
    .update(comments)
    .set({ deletedAt })
    .where(and(eq(comments.uri, uri), isNull(comments.deletedAt)))
    .returning({ subjectUri: comments.subjectUri });
  if (row) await incrementCommentCount(row.subjectUri, -1);
}

/** Whether `did` has anything indexed at all, across every table it could own a row in. */
async function hasAnyData(did: string): Promise<boolean> {
  const [row] = Array.from(
    await db.execute(sql`
      SELECT (
        EXISTS(SELECT 1 FROM userstyles WHERE did = ${did}) OR
        EXISTS(SELECT 1 FROM profiles WHERE did = ${did}) OR
        EXISTS(SELECT 1 FROM comments WHERE did = ${did}) OR
        EXISTS(SELECT 1 FROM ratings WHERE did = ${did}) OR
        EXISTS(SELECT 1 FROM follows WHERE did = ${did})
      ) AS "exists"
    `),
  ) as unknown as { exists: boolean }[];
  return row?.exists ?? false;
}

/** Removes all stored records for an account. */
export async function deleteAccountData(did: string, now: number): Promise<boolean> {
  if (!(await hasAnyData(did))) return false;

  const [commentUris, ratingUris, followUris, userstyleUris] = await Promise.all([
    db
      .select({ uri: comments.uri })
      .from(comments)
      .where(and(eq(comments.did, did), isNull(comments.deletedAt))),
    db.select({ uri: ratings.uri }).from(ratings).where(eq(ratings.did, did)),
    db.select({ uri: follows.uri }).from(follows).where(eq(follows.did, did)),
    db.select({ uri: userstyles.uri }).from(userstyles).where(eq(userstyles.did, did)),
  ]);

  for (const { uri } of commentUris) await deleteComment(uri, now);
  for (const { uri } of ratingUris) await deleteRating(uri);
  for (const { uri } of followUris) await deleteFollow(uri);
  for (const { uri } of userstyleUris) await deleteUserstyle(uri);
  await deleteProfile(did);
  return true;
}

export async function getUserstyle(uri: string): Promise<UserstyleRow | null> {
  const [row] = await db.select(userstyleColumns).from(userstyles).where(eq(userstyles.uri, uri));
  return row ?? null;
}

export async function getUserstyles(uris: string[]): Promise<UserstyleRow[]> {
  if (uris.length === 0) return [];
  return db.select(userstyleColumns).from(userstyles).where(inArray(userstyles.uri, uris));
}

/** `cursor: [indexedAt, rowid]` of the last row from the previous page, exclusive. */
export async function listUserstyles(
  actor: string | null,
  cursor: [number, number] | null,
  limit: number,
): Promise<UserstyleRow[]> {
  const conditions = [];
  if (actor) conditions.push(eq(userstyles.did, actor));
  if (cursor) {
    const [indexedAt, rowid] = cursor;
    conditions.push(sql`(${userstyles.indexedAt}, ${userstyles.rowid}) < (${indexedAt}, ${rowid})`);
  }

  return db
    .select(userstyleColumns)
    .from(userstyles)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(userstyles.indexedAt), desc(userstyles.rowid))
    .limit(limit);
}

export async function countUserstyles(actor: string | null): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userstyles)
    .where(actor ? eq(userstyles.did, actor) : undefined);
  return row?.count ?? 0;
}

export async function getProfile(did: string): Promise<ProfileRow | null> {
  const [row] = await db.select(profileColumns).from(profiles).where(eq(profiles.did, did));
  return row ?? null;
}

export async function getProfiles(dids: string[]): Promise<ProfileRow[]> {
  if (dids.length === 0) return [];
  return db.select(profileColumns).from(profiles).where(inArray(profiles.did, dids));
}

function ratingFilterCondition(filter: SubjectAuthorFilter) {
  const conditions = [];
  if (filter.subjectUri) conditions.push(eq(ratings.subjectUri, filter.subjectUri));
  if (filter.author) conditions.push(eq(ratings.did, filter.author));
  return conditions.length ? and(...conditions) : undefined;
}

/** Current ratings (latest rkey per (subject, rater)), optionally scoped to one subject and/or one rater.
 * `cursor: [indexedAt, uri]` of the last row from the previous page, exclusive. */
export async function listCurrentRatings(
  filter: SubjectAuthorFilter,
  cursor: [number, string] | null,
  limit: number,
): Promise<RatingRow[]> {
  const current = db
    .selectDistinctOn([ratings.subjectUri, ratings.did], ratingColumns)
    .from(ratings)
    .where(ratingFilterCondition(filter))
    .orderBy(ratings.subjectUri, ratings.did, desc(ratings.rkey))
    .as('current');

  const conditions = [];
  if (cursor) {
    const [indexedAt, uri] = cursor;
    conditions.push(sql`(${current.indexedAt}, ${current.uri}) < (${indexedAt}, ${uri})`);
  }

  return db
    .select()
    .from(current)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(current.indexedAt), desc(current.uri))
    .limit(limit);
}

/** Get a summary of the count and average across the same current-ratings set listCurrentRatings pages through.
 * Subject-only queries (common, e.g. a single userstyle's rating summary) read straight off userstyles.rating_count/rating_sum.
 * Author-scoped (or unfiltered) queries have no such per-row equivalent and are hence computed live. */
export async function getRatingSummary(
  filter: SubjectAuthorFilter,
): Promise<{ count: number; average: number | null }> {
  if (filter.subjectUri && !filter.author) {
    const [row] = await db
      .select({ count: userstyles.ratingCount, sum: userstyles.ratingSum })
      .from(userstyles)
      .where(eq(userstyles.uri, filter.subjectUri));
    if (!row) return { count: 0, average: null };
    return { count: row.count, average: row.count > 0 ? row.sum / row.count : null };
  }

  const current = db
    .selectDistinctOn([ratings.subjectUri, ratings.did], { rating: ratings.rating })
    .from(ratings)
    .where(ratingFilterCondition(filter))
    .orderBy(ratings.subjectUri, ratings.did, desc(ratings.rkey))
    .as('current');

  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
      average: sql<number | null>`avg(${current.rating})::float`,
    })
    .from(current);
  return { count: row?.count ?? 0, average: row?.average ?? null };
}

/** Current rating (latest rkey per rater) for every rater on subjectUri, keyed by rater did. */
export async function getCurrentRatingsByAuthor(subjectUri: string): Promise<Map<string, number>> {
  const rows = await db
    .selectDistinctOn([ratings.did], { did: ratings.did, rating: ratings.rating })
    .from(ratings)
    .where(eq(ratings.subjectUri, subjectUri))
    .orderBy(ratings.did, desc(ratings.rkey));
  return new Map(rows.map((r) => [r.did, r.rating]));
}

function commentFilterCondition(filter: SubjectAuthorFilter) {
  const conditions = [isNull(comments.deletedAt)];
  if (filter.subjectUri) conditions.push(eq(comments.subjectUri, filter.subjectUri));
  if (filter.author) conditions.push(eq(comments.did, filter.author));
  return and(...conditions);
}

/** Excludes tombstoned (deleted) comments.
 * `cursor: [indexedAt, uri]` of the last row from the previous page, exclusive. */
export async function listComments(
  filter: SubjectAuthorFilter,
  cursor: [number, string] | null,
  limit: number,
): Promise<CommentRow[]> {
  const conditions = [commentFilterCondition(filter)];
  if (cursor) {
    const [indexedAt, uri] = cursor;
    conditions.push(sql`(${comments.indexedAt}, ${comments.uri}) < (${indexedAt}, ${uri})`);
  }

  return db
    .select(commentColumns)
    .from(comments)
    .where(and(...conditions))
    .orderBy(desc(comments.indexedAt), desc(comments.uri))
    .limit(limit);
}

export async function countComments(filter: SubjectAuthorFilter): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(comments)
    .where(commentFilterCondition(filter));
  return row?.count ?? 0;
}

const commentThreadColumns = { ...commentColumns, deletedAt: commentDeletedAt };
export type CommentThreadRow = Pick<
  typeof comments.$inferSelect,
  keyof typeof commentThreadColumns
>;

/** Every comment on subject userstyle uri, flattened across every top-level thread, ordered so a parent always precedes its children. */
export async function getCommentThreads(subjectUri: string): Promise<CommentThreadRow[]> {
  const rows = await db
    .select(commentThreadColumns)
    .from(comments)
    .where(eq(comments.subjectUri, subjectUri))
    .orderBy(comments.indexedAt);

  const repliesByParent = new Map<string, CommentThreadRow[]>();
  const roots: CommentThreadRow[] = [];
  for (const row of rows) {
    if (row.parentUri === null) {
      roots.push(row);
      continue;
    }
    const replies = repliesByParent.get(row.parentUri);
    if (replies) replies.push(row);
    else repliesByParent.set(row.parentUri, [row]);
  }

  // A thread with nothing left to show (every node tombstoned) isn't worth returning at all.
  // TODO: Consider deleting all data for an entirely tombstoned thread instead of just filtering?
  const hasLiveDescendant = (node: CommentThreadRow): boolean =>
    node.deletedAt === null || (repliesByParent.get(node.uri) ?? []).some(hasLiveDescendant);

  const thread: CommentThreadRow[] = [];
  const visit = (node: CommentThreadRow) => {
    thread.push(node);
    for (const reply of repliesByParent.get(node.uri) ?? []) visit(reply);
  };
  for (const root of roots) {
    if (hasLiveDescendant(root)) visit(root);
  }
  return thread;
}

/** DIDs of everyone who authored a comment strictly above `parentUri` in its reply chain. */
export async function getThreadAncestorAuthors(parentUri: string): Promise<string[]> {
  const rows = Array.from(
    await db.execute(sql`
      WITH RECURSIVE ancestors AS (
        SELECT did, parent_uri AS "parentUri", 0 AS depth FROM comments WHERE uri = ${parentUri}
        UNION ALL
        SELECT c.did, c.parent_uri AS "parentUri", a.depth + 1 AS depth
        FROM comments c
        JOIN ancestors a ON c.uri = a."parentUri"
      )
      SELECT DISTINCT did FROM ancestors WHERE depth > 0
    `),
  ) as unknown as { did: string }[];
  return rows.map((r) => r.did);
}

const followingColumns = {
  uri: follows.uri,
  did: follows.subjectDid,
  createdAt: follows.createdAt,
  indexedAt: follows.indexedAt,
};
const followerColumns = {
  uri: follows.uri,
  did: follows.did,
  createdAt: follows.createdAt,
  indexedAt: follows.indexedAt,
};

/** Accounts `actor` follows, most recent first.
 * `cursor: [indexedAt, uri]` exclusive. */
export async function listFollows(
  actor: string,
  cursor: [number, string] | null,
  limit: number,
): Promise<FollowRow[]> {
  const conditions = [eq(follows.did, actor)];
  if (cursor) {
    const [indexedAt, uri] = cursor;
    conditions.push(sql`(${follows.indexedAt}, ${follows.uri}) < (${indexedAt}, ${uri})`);
  }
  return db
    .select(followingColumns)
    .from(follows)
    .where(and(...conditions))
    .orderBy(desc(follows.indexedAt), desc(follows.uri))
    .limit(limit);
}

/** Accounts that follow `actor`, most recent first.
 * `cursor: [indexedAt, uri]` exclusive. */
export async function listFollowers(
  actor: string,
  cursor: [number, string] | null,
  limit: number,
): Promise<FollowRow[]> {
  const conditions = [eq(follows.subjectDid, actor)];
  if (cursor) {
    const [indexedAt, uri] = cursor;
    conditions.push(sql`(${follows.indexedAt}, ${follows.uri}) < (${indexedAt}, ${uri})`);
  }
  return db
    .select(followerColumns)
    .from(follows)
    .where(and(...conditions))
    .orderBy(desc(follows.indexedAt), desc(follows.uri))
    .limit(limit);
}

/** Number of accounts `actor` follows. */
export async function countFollows(actor: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(follows)
    .where(eq(follows.did, actor));
  return row?.count ?? 0;
}

/** Number of accounts that follow `actor`. */
export async function countFollowers(actor: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(follows)
    .where(eq(follows.subjectDid, actor));
  return row?.count ?? 0;
}

export interface RelationshipRow {
  following?: string;
  followedBy?: string;
}

/** Whether `actor` follows `other`, and whether `other` follows `actor` back. */
export async function getRelationship(actor: string, other: string): Promise<RelationshipRow> {
  const [[followingRow], [followedByRow]] = await Promise.all([
    db
      .select({ uri: follows.uri })
      .from(follows)
      .where(and(eq(follows.did, actor), eq(follows.subjectDid, other)))
      .orderBy(desc(follows.indexedAt))
      .limit(1),
    db
      .select({ uri: follows.uri })
      .from(follows)
      .where(and(eq(follows.did, other), eq(follows.subjectDid, actor)))
      .orderBy(desc(follows.indexedAt))
      .limit(1),
  ]);
  return { following: followingRow?.uri, followedBy: followedByRow?.uri };
}

/** Batch variant of {@link getRelationship}: `actor`'s relationship with each of `others`. */
export async function getRelationships(
  actor: string,
  others: string[],
): Promise<Map<string, RelationshipRow>> {
  const result = new Map<string, RelationshipRow>(others.map((other) => [other, {}]));
  if (others.length === 0) return result;

  const [followingRows, followedByRows] = await Promise.all([
    db
      .selectDistinctOn([follows.subjectDid], { subjectDid: follows.subjectDid, uri: follows.uri })
      .from(follows)
      .where(and(eq(follows.did, actor), inArray(follows.subjectDid, others)))
      .orderBy(follows.subjectDid, desc(follows.indexedAt)),
    db
      .selectDistinctOn([follows.did], { did: follows.did, uri: follows.uri })
      .from(follows)
      .where(and(eq(follows.subjectDid, actor), inArray(follows.did, others)))
      .orderBy(follows.did, desc(follows.indexedAt)),
  ]);

  for (const row of followingRows) {
    result.set(row.subjectDid, { ...result.get(row.subjectDid), following: row.uri });
  }
  for (const row of followedByRows) {
    result.set(row.did, { ...result.get(row.did), followedBy: row.uri });
  }
  return result;
}

export interface SearchUserstylesParams {
  query?: string;
  sort: 'top' | 'latest' | 'popular';
  author?: string;
  since?: string;
  before?: string;
  homepage?: string;
  upstream?: string;
  cursor: [number, number] | null;
  limit: number;
}

export type SearchUserstyleRow = UserstyleRow & { sortKey: number };

function likePattern(value: string): string {
  return `%${value.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
}

/** `cursor: [sortKey, rowid]` of the last row from the previous page, exclusive.
 * `sortKey`'s meaning depends on `sort` (and, for "top", on whether `query` is set).
 * A cursor from one combination isn't meaningful under a different one. */
export async function searchUserstyles(
  params: SearchUserstylesParams,
): Promise<SearchUserstyleRow[]> {
  const conditions = [];
  if (params.query) {
    conditions.push(
      sql`${userstyles.searchVector} @@ websearch_to_tsquery('english', ${params.query})`,
    );
  }
  if (params.author) conditions.push(eq(userstyles.did, params.author));
  if (params.since) {
    conditions.push(sql`${userstyles.createdAt}::timestamptz >= ${params.since}::timestamptz`);
  }
  if (params.before) {
    conditions.push(sql`${userstyles.createdAt}::timestamptz < ${params.before}::timestamptz`);
  }
  if (params.homepage) {
    conditions.push(sql`${userstyles.homepageUrl} ILIKE ${likePattern(params.homepage)}`);
  }
  if (params.upstream) {
    conditions.push(sql`${userstyles.upstreamUrl} ILIKE ${likePattern(params.upstream)}`);
  }

  // "top" only means anything relative to a search term; without one there's no relevance signal to rank by, so it falls back to recency same as "latest".
  const sortKey =
    params.sort === 'top' && params.query
      ? sql<number>`ts_rank(${userstyles.searchVector}, websearch_to_tsquery('english', ${params.query}))`
      : params.sort === 'popular'
        ? sql<number>`${userstyles.popularity}`
        : sql<number>`${userstyles.indexedAt}`;

  if (params.cursor) {
    const [key, rowid] = params.cursor;
    conditions.push(sql`(${sortKey}, ${userstyles.rowid}) < (${key}, ${rowid})`);
  }

  return db
    .select({ ...userstyleColumns, sortKey })
    .from(userstyles)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(sortKey), desc(userstyles.rowid))
    .limit(params.limit);
}

interface TimelineIndexRow {
  type: 'userstyle' | 'comment' | 'rating' | 'follow';
  uri: string;
  indexedAt: number;
}

export type TimelineItem =
  | { type: 'userstyle'; value: UserstyleRow }
  | { type: 'comment'; value: CommentRow }
  | { type: 'rating'; value: RatingRow }
  | { type: 'follow'; value: FollowActivityRow };

/** Activity feed: a fan-in over new userstyles, comments, ratings, and follows, most recently indexed first.
 * Global by default; with `actor`, scoped to just the accounts that actor follows.
 * `cursor: [indexedAt, uri]` exclusive. */
export async function getTimeline(
  cursor: [number, string] | null,
  limit: number,
  actor?: string,
): Promise<TimelineItem[]> {
  const cursorCondition = cursor
    ? sql`AND ("indexedAt", uri) < (${cursor[0]}, ${cursor[1]})`
    : sql``;
  const followingCondition = actor
    ? sql`AND did IN (SELECT subject_did FROM follows WHERE did = ${actor})`
    : sql``;

  const index = Array.from(
    await db.execute(sql`
      SELECT * FROM (
        SELECT 'userstyle' AS type, uri, indexed_at AS "indexedAt" FROM userstyles WHERE true ${followingCondition}
        UNION ALL
        SELECT 'comment' AS type, uri, indexed_at AS "indexedAt" FROM comments WHERE deleted_at IS NULL ${followingCondition}
        UNION ALL
        SELECT 'rating' AS type, uri, indexed_at AS "indexedAt" FROM ratings WHERE true ${followingCondition}
        UNION ALL
        SELECT 'follow' AS type, uri, indexed_at AS "indexedAt" FROM follows WHERE true ${followingCondition}
      ) items
      WHERE true ${cursorCondition}
      ORDER BY "indexedAt" DESC, uri DESC
      LIMIT ${limit}
    `),
  ) as unknown as TimelineIndexRow[];
  if (index.length === 0) return [];

  const urisByType = {
    userstyle: index.filter((i) => i.type === 'userstyle').map((i) => i.uri),
    comment: index.filter((i) => i.type === 'comment').map((i) => i.uri),
    rating: index.filter((i) => i.type === 'rating').map((i) => i.uri),
    follow: index.filter((i) => i.type === 'follow').map((i) => i.uri),
  };

  const [userstyleRows, commentRows, ratingRows, followRows] = await Promise.all([
    urisByType.userstyle.length
      ? db
          .select(userstyleColumns)
          .from(userstyles)
          .where(inArray(userstyles.uri, urisByType.userstyle))
      : [],
    urisByType.comment.length
      ? db.select(commentColumns).from(comments).where(inArray(comments.uri, urisByType.comment))
      : [],
    urisByType.rating.length
      ? db.select(ratingColumns).from(ratings).where(inArray(ratings.uri, urisByType.rating))
      : [],
    urisByType.follow.length
      ? db
          .select(followActivityColumns)
          .from(follows)
          .where(inArray(follows.uri, urisByType.follow))
      : [],
  ]);

  const userstyleByUri = new Map(userstyleRows.map((r) => [r.uri, r]));
  const commentByUri = new Map(commentRows.map((r) => [r.uri, r]));
  const ratingByUri = new Map(ratingRows.map((r) => [r.uri, r]));
  const followByUri = new Map(followRows.map((r) => [r.uri, r]));

  const items: TimelineItem[] = [];
  for (const entry of index) {
    if (entry.type === 'userstyle') {
      const value = userstyleByUri.get(entry.uri);
      if (value) items.push({ type: 'userstyle', value });
    } else if (entry.type === 'comment') {
      const value = commentByUri.get(entry.uri);
      if (value) items.push({ type: 'comment', value });
    } else if (entry.type === 'rating') {
      const value = ratingByUri.get(entry.uri);
      if (value) items.push({ type: 'rating', value });
    } else {
      const value = followByUri.get(entry.uri);
      if (value) items.push({ type: 'follow', value });
    }
  }
  return items;
}

/** Notifications addressed to `actor`, most recent first.
 * `cursor: [indexedAt, id]` of the last row from the previous page, exclusive. */
export async function listNotifications(
  actor: string,
  cursor: [number, number] | null,
  limit: number,
): Promise<NotificationRow[]> {
  const conditions = [eq(notifications.recipientDid, actor)];
  if (cursor) {
    const [indexedAt, id] = cursor;
    conditions.push(sql`(${notifications.indexedAt}, ${notifications.id}) < (${indexedAt}, ${id})`);
  }

  return db
    .select(notificationColumns)
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.indexedAt), desc(notifications.id))
    .limit(limit);
}
