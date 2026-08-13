import type { Did, GenericUri, ResourceUri } from '@atcute/lexicons';
import { InvalidRequestError, json, XRPCError, XRPCRouter } from '@atcute/xrpc-server';
import { cors } from '@atcute/xrpc-server/middlewares/cors';

import {
  ClubUserstylesAlphaActorGetProfile,
  ClubUserstylesAlphaActorGetProfiles,
  ClubUserstylesAlphaCountUserstyles,
  ClubUserstylesAlphaFeedCountComments,
  ClubUserstylesAlphaFeedCountRatings,
  ClubUserstylesAlphaFeedGetFeedback,
  ClubUserstylesAlphaFeedGetTimeline,
  ClubUserstylesAlphaFeedListComments,
  ClubUserstylesAlphaFeedListRatings,
  ClubUserstylesAlphaFeedSearchUserstyles,
  ClubUserstylesAlphaGetUserstyle,
  ClubUserstylesAlphaGetUserstyleSourceCode,
  ClubUserstylesAlphaGraphCountFollowers,
  ClubUserstylesAlphaGraphCountFollows,
  ClubUserstylesAlphaGraphGetRelationship,
  ClubUserstylesAlphaGraphGetRelationships,
  ClubUserstylesAlphaGraphListFollowers,
  ClubUserstylesAlphaGraphListFollows,
  ClubUserstylesAlphaListUserstyles,
  ClubUserstylesAlphaNotificationListNotifications,
} from '@userstyles.club/atcute';
import {
  type CommentRow,
  type CommentThreadRow,
  countComments,
  countFollowers,
  countFollows,
  countUserstyles,
  type FollowRow,
  getCommentThreads,
  getCurrentRatingsByAuthor,
  getProfile,
  getProfiles,
  getRelationship,
  getRelationships,
  getTimeline,
  getUserstyle,
  getUserstyles,
  listComments,
  listCurrentRatings,
  listFollowers,
  listFollows,
  listNotifications,
  listUserstyles,
  type NotificationRow,
  type ProfileRow,
  type RatingRow,
  type RelationshipRow,
  getRatingSummary,
  searchUserstyles,
  type SubjectAuthorFilter,
  type UserstyleRow,
} from './db/index.ts';
import { getCachedBlobTextFor } from './usercss.ts';

const USERSTYLE_COLLECTION = 'club.userstyles.alpha.userstyle';

function toUserstyleView(row: UserstyleRow) {
  return {
    uri: row.uri as ResourceUri,
    cid: row.cid,
    author: row.did as Did,
    title: row.title,
    description: row.description ?? undefined,
    license: row.license ?? undefined,
    upstreamUrl: (row.upstreamUrl as GenericUri) ?? undefined,
    homepageUrl: (row.homepageUrl as GenericUri) ?? undefined,
    ignoreUpdateUrl: row.ignoreUpdateUrl,
    sourceCodeCid: row.sourceCodeCid,
    previewImageCid: row.previewImageCid ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt ?? undefined,
    indexedAt: new Date(row.indexedAt).toISOString(),
    mozDocumentFunctions: row.mozDocumentFunctions ?? undefined,
    userCssVars: row.userCssVars ?? undefined,
    commentCount: row.commentCount,
    ratingCount: row.ratingCount,
    ratingAverage: row.ratingCount > 0 ? (row.ratingSum / row.ratingCount).toFixed(2) : undefined,
  };
}

// Parse a `{indexedAt}_{rowid}`-formatted pagination cursor.
function parseCursor(cursor: string): [number, number] {
  const [indexedAtStr, rowidStr] = cursor.split('_');
  const indexedAt = indexedAtStr ? Number(indexedAtStr) : NaN;
  const rowid = rowidStr ? Number(rowidStr) : NaN;
  if (!Number.isInteger(indexedAt) || !Number.isInteger(rowid)) {
    throw new InvalidRequestError({ message: 'malformed cursor' });
  }
  return [indexedAt, rowid];
}

// Parse a `{indexedAt}_{uri}`-formatted pagination cursor, used by tables without a bigserial rowid.
function parseCursorUri(cursor: string): [number, string] {
  const separatorIndex = cursor.indexOf('_');
  const indexedAt = separatorIndex === -1 ? NaN : Number(cursor.slice(0, separatorIndex));
  const uri = cursor.slice(separatorIndex + 1);
  if (!Number.isInteger(indexedAt) || !uri) {
    throw new InvalidRequestError({ message: 'malformed cursor' });
  }
  return [indexedAt, uri];
}

// Parse a `{sortKey}_{rowid}`-formatted pagination cursor, where sortKey can be fractional.
function parseSearchCursor(cursor: string): [number, number] {
  const separatorIndex = cursor.indexOf('_');
  const sortKey = separatorIndex === -1 ? NaN : Number(cursor.slice(0, separatorIndex));
  const rowid = Number(cursor.slice(separatorIndex + 1));
  if (!Number.isFinite(sortKey) || !Number.isInteger(rowid)) {
    throw new InvalidRequestError({ message: 'malformed cursor' });
  }
  return [sortKey, rowid];
}

// Build a cursor for the next page, if this page was full.
// `keyFn` mirrors whichever parseCursor* the endpoint uses.
function buildCursor<T>(rows: T[], limit: number, keyFn: (row: T) => string): string | undefined {
  const last = rows.at(-1);
  return rows.length === limit && last ? keyFn(last) : undefined;
}

function buildSubjectAuthorFilter(params: {
  subject?: string;
  author?: string;
}): SubjectAuthorFilter {
  return { subjectUri: params.subject, author: params.author };
}

// Shared by getUserstyle and getUserstyleSourceCode, which both resolve an actor and rkey to a userstyle.
async function getUserstyleOrThrow(actor: string, rkey: string): Promise<UserstyleRow> {
  const uri = `at://${actor}/${USERSTYLE_COLLECTION}/${rkey}`;
  const row = await getUserstyle(uri);
  if (!row) {
    throw new XRPCError({
      status: 404,
      error: 'UserstyleNotFound',
      message: `no userstyle found at ${uri}`,
    });
  }
  return row;
}

function toProfileView(row: ProfileRow) {
  return {
    did: row.did as Did,
    description: row.description ?? undefined,
    createdAt: row.createdAt,
    indexedAt: new Date(row.indexedAt).toISOString(),
  };
}

function toRatingView(row: RatingRow) {
  return {
    uri: row.uri as ResourceUri,
    cid: row.cid,
    author: row.did as Did,
    subjectUri: row.subjectUri as ResourceUri,
    rating: row.rating,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt ?? undefined,
    indexedAt: new Date(row.indexedAt).toISOString(),
  };
}

function toCommentView(row: CommentRow) {
  return {
    uri: row.uri as ResourceUri,
    cid: row.cid,
    author: row.did as Did,
    subjectUri: row.subjectUri as ResourceUri,
    parentUri: (row.parentUri as ResourceUri | null) ?? undefined,
    comment: row.comment,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt ?? undefined,
    indexedAt: new Date(row.indexedAt).toISOString(),
  };
}

function toCommentThreadView(row: CommentThreadRow, ratingsByAuthor?: Map<string, number>) {
  const deleted = row.deletedAt !== null;
  return {
    uri: row.uri as ResourceUri,
    parentUri: (row.parentUri as ResourceUri | null) ?? undefined,
    deleted,
    createdAt: row.createdAt,
    indexedAt: new Date(row.indexedAt).toISOString(),
    cid: deleted ? undefined : row.cid,
    author: deleted ? undefined : (row.did as Did),
    subjectUri: deleted ? undefined : (row.subjectUri as ResourceUri),
    comment: deleted ? undefined : row.comment,
    updatedAt: deleted ? undefined : (row.updatedAt ?? undefined),
    // Only attached to top-level (root) nodes, matching getFeedback's contract.
    rating: deleted || row.parentUri ? undefined : ratingsByAuthor?.get(row.did),
  };
}

function toFollowView(row: FollowRow) {
  return { did: row.did as Did, createdAt: row.createdAt };
}

function toRelationshipView(other: Did, row: RelationshipRow) {
  return {
    did: other,
    following: (row.following as ResourceUri) ?? undefined,
    followedBy: (row.followedBy as ResourceUri) ?? undefined,
  };
}

function toNotificationView(row: NotificationRow, userstyle: UserstyleRow | undefined) {
  return {
    reason: row.reason as 'comment' | 'reply' | 'thread' | 'rating' | 'follow',
    userstyle: userstyle ? toUserstyleView(userstyle) : undefined,
    recordUri: row.recordUri as ResourceUri,
    author: row.actorDid as Did,
    createdAt: row.createdAt,
    indexedAt: new Date(row.indexedAt).toISOString(),
  };
}

export const router = new XRPCRouter({
  middlewares: [cors()],
});

router.addQuery(ClubUserstylesAlphaGetUserstyle, {
  async handler({ params }) {
    const row = await getUserstyleOrThrow(params.actor, params.rkey);
    return json(toUserstyleView(row));
  },
});

router.addQuery(ClubUserstylesAlphaGetUserstyleSourceCode, {
  async handler({ params }) {
    const row = await getUserstyleOrThrow(params.actor, params.rkey);
    try {
      const sourceCode = await getCachedBlobTextFor(row.did, row.sourceCodeCid);
      return new Response(sourceCode, { headers: { 'content-type': 'text/css; charset=utf-8' } });
    } catch (err) {
      throw new XRPCError({
        status: 502,
        error: 'SourceUnavailable',
        message: `failed to fetch source code for ${row.uri}`,
      });
    }
  },
});

router.addQuery(ClubUserstylesAlphaListUserstyles, {
  async handler({ params }) {
    const cursor = params.cursor ? parseCursor(params.cursor) : null;
    const rows = await listUserstyles(params.actor ?? null, cursor, params.limit);
    const nextCursor = buildCursor(rows, params.limit, (r) => `${r.indexedAt}_${r.rowid}`);

    return json({ cursor: nextCursor, userstyles: rows.map(toUserstyleView) });
  },
});

router.addQuery(ClubUserstylesAlphaCountUserstyles, {
  async handler({ params }) {
    const count = await countUserstyles(params.actor ?? null);
    return json({ count });
  },
});

router.addQuery(ClubUserstylesAlphaActorGetProfile, {
  async handler({ params }) {
    const row = await getProfile(params.actor);
    if (!row) {
      throw new XRPCError({
        status: 404,
        error: 'ProfileNotFound',
        message: `no profile found for ${params.actor}`,
      });
    }
    return json(toProfileView(row));
  },
});

router.addQuery(ClubUserstylesAlphaActorGetProfiles, {
  async handler({ params }) {
    const rows = await getProfiles([...params.actors]);
    return json({ profiles: rows.map(toProfileView) });
  },
});

router.addQuery(ClubUserstylesAlphaGraphListFollows, {
  async handler({ params }) {
    const cursor = params.cursor ? parseCursorUri(params.cursor) : null;
    const rows = await listFollows(params.actor, cursor, params.limit);
    const nextCursor = buildCursor(rows, params.limit, (r) => `${r.indexedAt}_${r.uri}`);

    return json({ cursor: nextCursor, follows: rows.map(toFollowView) });
  },
});

router.addQuery(ClubUserstylesAlphaGraphListFollowers, {
  async handler({ params }) {
    const cursor = params.cursor ? parseCursorUri(params.cursor) : null;
    const rows = await listFollowers(params.actor, cursor, params.limit);
    const nextCursor = buildCursor(rows, params.limit, (r) => `${r.indexedAt}_${r.uri}`);

    return json({ cursor: nextCursor, followers: rows.map(toFollowView) });
  },
});

router.addQuery(ClubUserstylesAlphaGraphCountFollows, {
  async handler({ params }) {
    const count = await countFollows(params.actor);
    return json({ count });
  },
});

router.addQuery(ClubUserstylesAlphaGraphCountFollowers, {
  async handler({ params }) {
    const count = await countFollowers(params.actor);
    return json({ count });
  },
});

router.addQuery(ClubUserstylesAlphaGraphGetRelationship, {
  async handler({ params }) {
    const relationship = await getRelationship(params.actor, params.other);
    return json(toRelationshipView(params.other as Did, relationship));
  },
});

router.addQuery(ClubUserstylesAlphaGraphGetRelationships, {
  async handler({ params }) {
    const relationships = await getRelationships(params.actor, [...params.others]);
    return json({
      relationships: [...relationships].map(([other, row]) =>
        toRelationshipView(other as Did, row),
      ),
    });
  },
});

router.addQuery(ClubUserstylesAlphaFeedListComments, {
  async handler({ params }) {
    const filter = buildSubjectAuthorFilter(params);
    const cursor = params.cursor ? parseCursorUri(params.cursor) : null;
    const rows = await listComments(filter, cursor, params.limit);
    const nextCursor = buildCursor(rows, params.limit, (r) => `${r.indexedAt}_${r.uri}`);

    return json({ cursor: nextCursor, comments: rows.map(toCommentView) });
  },
});

router.addQuery(ClubUserstylesAlphaFeedCountComments, {
  async handler({ params }) {
    const filter = buildSubjectAuthorFilter(params);
    const count = await countComments(filter);
    return json({ count });
  },
});

router.addQuery(ClubUserstylesAlphaFeedListRatings, {
  async handler({ params }) {
    const filter = buildSubjectAuthorFilter(params);
    const cursor = params.cursor ? parseCursorUri(params.cursor) : null;
    const rows = await listCurrentRatings(filter, cursor, params.limit);
    const nextCursor = buildCursor(rows, params.limit, (r) => `${r.indexedAt}_${r.uri}`);

    return json({ cursor: nextCursor, ratings: rows.map(toRatingView) });
  },
});

router.addQuery(ClubUserstylesAlphaFeedCountRatings, {
  async handler({ params }) {
    const filter = buildSubjectAuthorFilter(params);
    const { count, average } = await getRatingSummary(filter);
    return json({ count, average: average === null ? undefined : average.toFixed(2) });
  },
});

router.addQuery(ClubUserstylesAlphaFeedSearchUserstyles, {
  async handler({ params }) {
    const cursor = params.cursor ? parseSearchCursor(params.cursor) : null;
    const rows = await searchUserstyles({
      query: params.query,
      sort: params.sort ?? 'latest',
      author: params.author,
      since: params.since,
      before: params.before,
      homepage: params.homepage,
      upstream: params.upstream,
      cursor,
      limit: params.limit,
    });
    const nextCursor = buildCursor(rows, params.limit, (r) => `${r.sortKey}_${r.rowid}`);

    return json({ cursor: nextCursor, userstyles: rows.map(toUserstyleView) });
  },
});

router.addQuery(ClubUserstylesAlphaFeedGetFeedback, {
  async handler({ params }) {
    const [threadRows, ratingSummary, ratingsByAuthor] = await Promise.all([
      getCommentThreads(params.subject),
      getRatingSummary({ subjectUri: params.subject }),
      getCurrentRatingsByAuthor(params.subject),
    ]);

    const comments = threadRows.map((row) => toCommentThreadView(row, ratingsByAuthor));

    return json({
      comments,
      ratingCount: ratingSummary.count,
      ratingAverage: ratingSummary.average === null ? undefined : ratingSummary.average.toFixed(2),
    });
  },
});

router.addQuery(ClubUserstylesAlphaFeedGetTimeline, {
  async handler({ params }) {
    const cursor = params.cursor ? parseCursorUri(params.cursor) : null;
    const items = await getTimeline(cursor, params.limit, params.actor);
    const nextCursor = buildCursor(
      items,
      params.limit,
      (item) => `${item.value.indexedAt}_${item.value.uri}`,
    );

    const feed = items.map((item) => {
      if (item.type === 'userstyle') {
        return { type: 'userstyle' as const, userstyle: toUserstyleView(item.value) };
      }
      if (item.type === 'comment') {
        return { type: 'comment' as const, comment: toCommentView(item.value) };
      }
      return { type: 'rating' as const, rating: toRatingView(item.value) };
    });

    return json({ cursor: nextCursor, feed });
  },
});

router.addQuery(ClubUserstylesAlphaNotificationListNotifications, {
  async handler({ params }) {
    const cursor = params.cursor ? parseCursor(params.cursor) : null;
    const rows = await listNotifications(params.actor, cursor, params.limit);
    const nextCursor = buildCursor(rows, params.limit, (r) => `${r.indexedAt}_${r.id}`);

    const userstyleUris = [
      ...new Set(rows.map((r) => r.userstyleUri).filter((uri) => uri !== null)),
    ];
    const userstyleRows = await getUserstyles(userstyleUris);
    const userstyleByUri = new Map(userstyleRows.map((row) => [row.uri, row]));

    return json({
      cursor: nextCursor,
      notifications: rows.map((row) =>
        toNotificationView(
          row,
          row.userstyleUri ? userstyleByUri.get(row.userstyleUri) : undefined,
        ),
      ),
    });
  },
});
