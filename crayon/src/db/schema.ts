import { sql } from 'drizzle-orm';
import {
  bigint,
  bigserial,
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type { MozDocumentFunction } from 'usercss-parser';

// No first-class tsvector column builder exists in Drizzle by default.
const tsvector = customType<{ data: string }>({
  dataType: () => 'tsvector',
});

export const userstyles = pgTable(
  'userstyles',
  {
    rowid: bigserial('rowid', { mode: 'number' }).notNull(),
    uri: text('uri').primaryKey(),
    cid: text('cid').notNull(),
    did: text('did').notNull(),
    rkey: text('rkey').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    license: text('license'),
    upstreamUrl: text('upstream_url'),
    homepageUrl: text('homepage_url'),
    ignoreUpdateUrl: boolean('ignore_update_url').notNull().default(false),
    sourceCodeCid: text('source_code_cid').notNull(),
    previewImageCid: text('preview_image_cid'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at'),
    indexedAt: bigint('indexed_at', { mode: 'number' }).notNull(),
    searchVector: tsvector('search_vector').generatedAlwaysAs(
      sql`setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(description, '')), 'B')`,
    ),
    // Derived from parsing the userstyle's source (see ../usercss.ts) rather than the record.
    // null means "not derived yet" (fetch/parse failed, or ingested before this field existed),
    // distinct from `[]`/`false` which are actual results from parsing.
    mozDocumentFunctions: jsonb('moz_document_rules').$type<MozDocumentFunction[]>(),
    userCssVars: integer('user_css_vars'),
    commentCount: integer('comment_count').notNull().default(0),
    ratingCount: integer('rating_count').notNull().default(0),
    ratingSum: integer('rating_sum').notNull().default(0),
    popularity: integer('popularity').generatedAlwaysAs(sql`comment_count + rating_count`),
  },
  (t) => [
    index('userstyles_did_idx').on(t.did),
    index('userstyles_indexed_at_idx').on(t.indexedAt),
    index('userstyles_homepage_idx').on(t.homepageUrl),
    index('userstyles_upstream_idx').on(t.upstreamUrl),
    index('userstyles_search_idx').using('gin', t.searchVector),
    index('userstyles_popularity_idx').on(t.popularity),
  ],
);

export const profiles = pgTable('profiles', {
  did: text('did').primaryKey(),
  description: text('description'),
  createdAt: text('created_at').notNull(),
  cid: text('cid').notNull(),
  indexedAt: bigint('indexed_at', { mode: 'number' }).notNull(),
});

// Every rating record ever seen, upserted in place by uri: an "update" action edits the same rkey's row while a re-rate from the same author may instead show up as a brand new uri/rkey).
// "current" rating per (subject, rater) is derived while reading with `SELECT DISTINCT ON (did) ... ORDER BY did, rkey DESC`. */
export const ratings = pgTable(
  'ratings',
  {
    uri: text('uri').primaryKey(),
    cid: text('cid').notNull(),
    did: text('did').notNull(),
    rkey: text('rkey').notNull(),
    subjectUri: text('subject_uri').notNull(),
    subjectCid: text('subject_cid').notNull(),
    rating: integer('rating').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at'),
    indexedAt: bigint('indexed_at', { mode: 'number' }).notNull(),
  },
  (t) => [
    // Serves both the single-rater point lookup and the DISTINCT ON aggregate below.
    index('ratings_subject_did_rkey_idx').on(t.subjectUri, t.did, t.rkey.desc()),
    index('ratings_did_idx').on(t.did),
  ],
);

export const comments = pgTable(
  'comments',
  {
    uri: text('uri').primaryKey(),
    cid: text('cid').notNull(),
    did: text('did').notNull(),
    rkey: text('rkey').notNull(),
    subjectUri: text('subject_uri').notNull(),
    subjectCid: text('subject_cid').notNull(),
    parentUri: text('parent_uri'),
    parentCid: text('parent_cid'),
    comment: text('comment').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at'),
    indexedAt: bigint('indexed_at', { mode: 'number' }).notNull(),
    // Tombstone rather than delete, so thread structure (replies to this comment) survives.
    deletedAt: bigint('deleted_at', { mode: 'number' }),
  },
  (t) => [
    index('comments_subject_idx').on(t.subjectUri),
    index('comments_parent_idx').on(t.parentUri),
    index('comments_did_idx').on(t.did),
  ],
);

export const follows = pgTable(
  'follows',
  {
    uri: text('uri').primaryKey(),
    cid: text('cid').notNull(),
    did: text('did').notNull(),
    rkey: text('rkey').notNull(),
    subjectDid: text('subject_did').notNull(),
    createdAt: text('created_at').notNull(),
    indexedAt: bigint('indexed_at', { mode: 'number' }).notNull(),
  },
  (t) => [
    index('follows_did_idx').on(t.did, t.indexedAt.desc()),
    index('follows_subject_did_idx').on(t.subjectDid, t.indexedAt.desc()),
  ],
);

export const notifications = pgTable(
  'notifications',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    recipientDid: text('recipient_did').notNull(),
    reason: text('reason').notNull(),
    // Absent for `follow`, which has no userstyle subject.
    userstyleUri: text('userstyle_uri'),
    recordUri: text('record_uri').notNull(),
    actorDid: text('actor_did').notNull(),
    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  },
  (t) => [
    index('notifications_recipient_idx').on(t.recipientDid, t.createdAt),
    // A single record (e.g. a reply) can notify more than one recipient (the parent comment's author and the userstyle owner).
    uniqueIndex('notifications_record_recipient_idx').on(t.recordUri, t.recipientDid),
  ],
);
