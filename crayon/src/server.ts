import type { Did, GenericUri, Handle, ResourceUri } from '@atcute/lexicons';
import { isDid } from '@atcute/lexicons/syntax';
import {
  type FetchMiddleware,
  InvalidRequestError,
  json,
  XRPCError,
  XRPCRouter,
} from '@atcute/xrpc-server';
import { cors } from '@atcute/xrpc-server/middlewares/cors';

import { resolveActor, resolveActors, type ResolvedIdentity } from './identity.ts';

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
  type FollowActivityRow,
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
  type TimelineItem,
  type UserstyleRow,
} from './db/index.ts';
import { getSourceCode } from './usercss.ts';

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

async function resolveIdentityOrThrow(actor: string): Promise<ResolvedIdentity> {
  const identity = await resolveActor(actor);
  if (!identity) {
    throw new XRPCError({
      status: 404,
      error: 'ActorNotFound',
      message: `could not resolve actor ${actor}`,
    });
  }
  return identity;
}

async function resolveDidOrThrow(actor: string): Promise<Did> {
  if (isDid(actor)) return actor;
  const { did } = await resolveIdentityOrThrow(actor);
  return did;
}

async function buildSubjectAuthorFilter(params: {
  subject?: string;
  author?: string;
}): Promise<SubjectAuthorFilter> {
  return {
    subjectUri: params.subject,
    author: params.author ? await resolveDidOrThrow(params.author) : undefined,
  };
}

// Shared by getUserstyle and getUserstyleSourceCode, which both resolve an actor and rkey to a userstyle.
async function getUserstyleOrThrow(actor: string, rkey: string): Promise<UserstyleRow> {
  const did = await resolveDidOrThrow(actor);
  const uri = `at://${did}/${USERSTYLE_COLLECTION}/${rkey}`;
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

function toProfileView(did: Did, handle: Handle | undefined, row: ProfileRow | null) {
  return {
    did,
    handle,
    description: row?.description ?? undefined,
    createdAt: row?.createdAt,
    indexedAt: row ? new Date(row.indexedAt).toISOString() : undefined,
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

function toFeedFollowView(row: FollowActivityRow) {
  return {
    uri: row.uri as ResourceUri,
    did: row.did as Did,
    subjectDid: row.subjectDid as Did,
    createdAt: row.createdAt,
    indexedAt: new Date(row.indexedAt).toISOString(),
  };
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

// Every registered query lexicon.
const XRPC_QUERIES = [
  ClubUserstylesAlphaGetUserstyle,
  ClubUserstylesAlphaGetUserstyleSourceCode,
  ClubUserstylesAlphaListUserstyles,
  ClubUserstylesAlphaCountUserstyles,
  ClubUserstylesAlphaActorGetProfile,
  ClubUserstylesAlphaActorGetProfiles,
  ClubUserstylesAlphaGraphListFollows,
  ClubUserstylesAlphaGraphListFollowers,
  ClubUserstylesAlphaGraphCountFollows,
  ClubUserstylesAlphaGraphCountFollowers,
  ClubUserstylesAlphaGraphGetRelationship,
  ClubUserstylesAlphaGraphGetRelationships,
  ClubUserstylesAlphaFeedListComments,
  ClubUserstylesAlphaFeedCountComments,
  ClubUserstylesAlphaFeedListRatings,
  ClubUserstylesAlphaFeedCountRatings,
  ClubUserstylesAlphaFeedSearchUserstyles,
  ClubUserstylesAlphaFeedGetFeedback,
  ClubUserstylesAlphaFeedGetTimeline,
  ClubUserstylesAlphaNotificationListNotifications,
];

function nsidOf(query: { nsid: string } | { mainSchema: { nsid: string } }): string {
  return 'mainSchema' in query ? query.mainSchema.nsid : query.nsid;
}

const ROOT_TEXT = `

                        #
         ###           ###            #
         #--##       #*==#          #=#
         #----##    #=====#      ##===#
        #-###::#    #-----##    ####===#
        #:::::::#   *--:---#   #-----###
         #:::::::# #--:----#   #--:----#
         #:::::::# #-------#  #-------#
          #:::::::##-------# #-------#
           #::##...#######-####------#
           #.......#.......##.....#-#
            #.....##.......#.......#
            ####:::#------#---#+...#
             #:::::#------#-------#
              #::::#----:#-----:-#
              #::::#-----#------##
               #:::#-----##-----#
                             ###

This is Crayon, an AT Protocol [https://atproto.com] appview server for userstyles.club [https://userstyles.club].

Available routes:
${XRPC_QUERIES.map((query) => `- /xrpc/${nsidOf(query)}`).join('\n')}
`;

const index: FetchMiddleware = async (request, next) => {
  const { pathname } = new URL(request.url);
  if (pathname === '/') {
    return new Response(ROOT_TEXT, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
  return next(request);
};

export const router = new XRPCRouter({
  middlewares: [cors(), index],
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
      const sourceCode = await getSourceCode(row.did, row.sourceCodeCid);
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
    const did = params.actor ? await resolveDidOrThrow(params.actor) : null;
    const cursor = params.cursor ? parseCursor(params.cursor) : null;
    const rows = await listUserstyles(did, cursor, params.limit);
    const nextCursor = buildCursor(rows, params.limit, (r) => `${r.indexedAt}_${r.rowid}`);

    return json({ cursor: nextCursor, userstyles: rows.map(toUserstyleView) });
  },
});

router.addQuery(ClubUserstylesAlphaCountUserstyles, {
  async handler({ params }) {
    const did = params.actor ? await resolveDidOrThrow(params.actor) : null;
    const count = await countUserstyles(did);
    return json({ count });
  },
});

router.addQuery(ClubUserstylesAlphaActorGetProfile, {
  async handler({ params }) {
    const identity = await resolveIdentityOrThrow(params.actor);
    const row = await getProfile(identity.did);
    return json(toProfileView(identity.did, identity.handle, row));
  },
});

router.addQuery(ClubUserstylesAlphaActorGetProfiles, {
  async handler({ params }) {
    const identities = await resolveActors([...params.actors]);
    const resolved = [...identities.values()].filter(
      (identity): identity is ResolvedIdentity => identity !== undefined,
    );
    const rows = await getProfiles(resolved.map((identity) => identity.did));
    const rowByDid = new Map(rows.map((row) => [row.did, row]));
    return json({
      profiles: resolved.map((identity) =>
        toProfileView(identity.did, identity.handle, rowByDid.get(identity.did) ?? null),
      ),
    });
  },
});

router.addQuery(ClubUserstylesAlphaGraphListFollows, {
  async handler({ params }) {
    const did = await resolveDidOrThrow(params.actor);
    const cursor = params.cursor ? parseCursorUri(params.cursor) : null;
    const rows = await listFollows(did, cursor, params.limit);
    const nextCursor = buildCursor(rows, params.limit, (r) => `${r.indexedAt}_${r.uri}`);

    return json({ cursor: nextCursor, follows: rows.map(toFollowView) });
  },
});

router.addQuery(ClubUserstylesAlphaGraphListFollowers, {
  async handler({ params }) {
    const did = await resolveDidOrThrow(params.actor);
    const cursor = params.cursor ? parseCursorUri(params.cursor) : null;
    const rows = await listFollowers(did, cursor, params.limit);
    const nextCursor = buildCursor(rows, params.limit, (r) => `${r.indexedAt}_${r.uri}`);

    return json({ cursor: nextCursor, followers: rows.map(toFollowView) });
  },
});

router.addQuery(ClubUserstylesAlphaGraphCountFollows, {
  async handler({ params }) {
    const did = await resolveDidOrThrow(params.actor);
    const count = await countFollows(did);
    return json({ count });
  },
});

router.addQuery(ClubUserstylesAlphaGraphCountFollowers, {
  async handler({ params }) {
    const did = await resolveDidOrThrow(params.actor);
    const count = await countFollowers(did);
    return json({ count });
  },
});

router.addQuery(ClubUserstylesAlphaGraphGetRelationship, {
  async handler({ params }) {
    const [actorDid, otherDid] = await Promise.all([
      resolveDidOrThrow(params.actor),
      resolveDidOrThrow(params.other),
    ]);
    const relationship = await getRelationship(actorDid, otherDid);
    return json(toRelationshipView(otherDid, relationship));
  },
});

router.addQuery(ClubUserstylesAlphaGraphGetRelationships, {
  async handler({ params }) {
    const [actorDid, otherIdentities] = await Promise.all([
      resolveDidOrThrow(params.actor),
      resolveActors([...params.others]),
    ]);
    const otherDids = [...otherIdentities.values()]
      .filter((identity): identity is ResolvedIdentity => identity !== undefined)
      .map((identity) => identity.did);

    const relationships =
      otherDids.length > 0
        ? await getRelationships(actorDid, otherDids)
        : new Map<string, RelationshipRow>();
    return json({
      relationships: otherDids.map((other) =>
        toRelationshipView(other, relationships.get(other) ?? {}),
      ),
    });
  },
});

router.addQuery(ClubUserstylesAlphaFeedListComments, {
  async handler({ params }) {
    const filter = await buildSubjectAuthorFilter(params);
    const cursor = params.cursor ? parseCursorUri(params.cursor) : null;
    const rows = await listComments(filter, cursor, params.limit);
    const nextCursor = buildCursor(rows, params.limit, (r) => `${r.indexedAt}_${r.uri}`);

    return json({ cursor: nextCursor, comments: rows.map(toCommentView) });
  },
});

router.addQuery(ClubUserstylesAlphaFeedCountComments, {
  async handler({ params }) {
    const filter = await buildSubjectAuthorFilter(params);
    const count = await countComments(filter);
    return json({ count });
  },
});

router.addQuery(ClubUserstylesAlphaFeedListRatings, {
  async handler({ params }) {
    const filter = await buildSubjectAuthorFilter(params);
    const cursor = params.cursor ? parseCursorUri(params.cursor) : null;
    const rows = await listCurrentRatings(filter, cursor, params.limit);
    const nextCursor = buildCursor(rows, params.limit, (r) => `${r.indexedAt}_${r.uri}`);

    return json({ cursor: nextCursor, ratings: rows.map(toRatingView) });
  },
});

router.addQuery(ClubUserstylesAlphaFeedCountRatings, {
  async handler({ params }) {
    const filter = await buildSubjectAuthorFilter(params);
    const { count, average } = await getRatingSummary(filter);
    return json({ count, average: average === null ? undefined : average.toFixed(2) });
  },
});

router.addQuery(ClubUserstylesAlphaFeedSearchUserstyles, {
  async handler({ params }) {
    const author = params.author ? await resolveDidOrThrow(params.author) : undefined;

    const cursor = params.cursor ? parseSearchCursor(params.cursor) : null;
    const rows = await searchUserstyles({
      query: params.query,
      sort: params.sort ?? 'latest',
      author,
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
    const actor = params.actor ? await resolveDidOrThrow(params.actor) : undefined;

    const cursor = params.cursor ? parseCursorUri(params.cursor) : null;
    const items = await getTimeline(cursor, params.limit, actor);
    const nextCursor = buildCursor(
      items,
      params.limit,
      (item) => `${item.value.indexedAt}_${item.value.uri}`,
    );

    const subjectUriOf = (item: TimelineItem) =>
      item.type === 'userstyle'
        ? item.value.uri
        : item.type === 'follow'
          ? undefined
          : item.value.subjectUri;
    const subjectRows = await getUserstyles([
      ...new Set(items.map(subjectUriOf).filter((uri): uri is string => uri !== undefined)),
    ]);
    const subjectByUri = new Map(subjectRows.map((row) => [row.uri, row]));

    const feed = items.map((item) => {
      if (item.type === 'follow') {
        return { type: 'follow' as const, follow: toFeedFollowView(item.value) };
      }
      const subject = subjectByUri.get(subjectUriOf(item)!);
      const userstyle = subject ? toUserstyleView(subject) : undefined;
      if (item.type === 'userstyle') {
        return { type: 'userstyle' as const, userstyle };
      }
      if (item.type === 'comment') {
        return { type: 'comment' as const, comment: toCommentView(item.value), userstyle };
      }
      return { type: 'rating' as const, rating: toRatingView(item.value), userstyle };
    });

    return json({ cursor: nextCursor, feed });
  },
});

router.addQuery(ClubUserstylesAlphaNotificationListNotifications, {
  async handler({ params }) {
    const did = await resolveDidOrThrow(params.actor);
    const cursor = params.cursor ? parseCursor(params.cursor) : null;
    const rows = await listNotifications(did, cursor, params.limit);
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
