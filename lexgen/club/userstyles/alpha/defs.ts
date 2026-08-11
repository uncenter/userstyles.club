import {
  array,
  boolean,
  document,
  integer,
  object,
  ref,
  required,
  string,
} from '@atcute/lexicon-doc/builder';

// A @-moz-document match functionfrom a parsed userstyle's source.
export const mozDocumentFunction = object({
  properties: {
    name: required(string()),
    value: required(string()),
  },
});

export const userstyleView = object({
  properties: {
    uri: required(string({ format: 'at-uri' })),
    cid: required(string({ format: 'cid' })),
    author: required(string({ format: 'did' })),
    title: required(string({ maxGraphemes: 140, minGraphemes: 1 })),
    description: string({ maxGraphemes: 300 }),
    license: string({ maxLength: 100 }),
    upstreamUrl: string({ format: 'uri' }),
    homepageUrl: string({ format: 'uri' }),
    ignoreUpdateUrl: boolean(),
    sourceCodeCid: required(string({ format: 'cid' })),
    previewImageCid: string({ format: 'cid' }),
    createdAt: required(string({ format: 'datetime' })),
    updatedAt: string({ format: 'datetime' }),
    indexedAt: required(string({ format: 'datetime' })),
    mozDocumentFunctions: array({
      items: ref({ ref: 'club.userstyles.alpha.defs#mozDocumentFunction' }),
    }),
    userCssVars: integer(),
    commentCount: required(integer()),
    ratingCount: required(integer()),
    // TODO: Use float type if it becomes a thing?
    ratingAverage: string(),
  },
});

export const profileView = object({
  properties: {
    did: required(string({ format: 'did' })),
    description: string({ maxGraphemes: 256, maxLength: 2560 }),
    createdAt: required(string({ format: 'datetime' })),
    indexedAt: required(string({ format: 'datetime' })),
  },
});

export const ratingView = object({
  properties: {
    uri: required(string({ format: 'at-uri' })),
    cid: required(string({ format: 'cid' })),
    author: required(string({ format: 'did' })),
    subjectUri: required(string({ format: 'at-uri' })),
    rating: required(integer({ minimum: 1, maximum: 5 })),
    createdAt: required(string({ format: 'datetime' })),
    updatedAt: string({ format: 'datetime' }),
    indexedAt: required(string({ format: 'datetime' })),
  },
});

export const commentView = object({
  properties: {
    uri: required(string({ format: 'at-uri' })),
    cid: required(string({ format: 'cid' })),
    author: required(string({ format: 'did' })),
    subjectUri: required(string({ format: 'at-uri' })),
    parentUri: string({ format: 'at-uri' }),
    comment: required(string({ maxGraphemes: 256, maxLength: 2560 })),
    createdAt: required(string({ format: 'datetime' })),
    updatedAt: string({ format: 'datetime' }),
    indexedAt: required(string({ format: 'datetime' })),
  },
});

// A node in getFeedback's flattened reply tree.
// Deleted nodes are kept for intact thread structure (just uri/parentUri).
export const commentThreadView = object({
  properties: {
    uri: required(string({ format: 'at-uri' })),
    parentUri: string({ format: 'at-uri' }),
    deleted: required(boolean()),
    cid: string({ format: 'cid' }),
    author: string({ format: 'did' }),
    subjectUri: string({ format: 'at-uri' }),
    comment: string({ maxGraphemes: 256, maxLength: 2560 }),
    updatedAt: string({ format: 'datetime' }),
    createdAt: required(string({ format: 'datetime' })),
    indexedAt: required(string({ format: 'datetime' })),
    // Only set on a top-level (root) node whose author has a current rating on the subject.
    rating: integer({ minimum: 1, maximum: 5 }),
  },
});

export const followView = object({
  properties: {
    did: required(string({ format: 'did' })),
    createdAt: required(string({ format: 'datetime' })),
  },
});

export const relationshipView = object({
  properties: {
    did: required(string({ format: 'did' })),
    // Present with the follow record's uri if the queried actor follows `did`.
    following: string({ format: 'at-uri' }),
    // Present with the follow record's uri if `did` follows the queried actor back.
    followedBy: string({ format: 'at-uri' }),
  },
});

export const feedViewItem = object({
  properties: {
    type: required(string({ enum: ['userstyle', 'comment', 'rating'] })),
    userstyle: ref({ ref: 'club.userstyles.alpha.defs#userstyleView' }),
    comment: ref({ ref: 'club.userstyles.alpha.defs#commentView' }),
    rating: ref({ ref: 'club.userstyles.alpha.defs#ratingView' }),
  },
});

export const notificationView = object({
  properties: {
    reason: required(string({ enum: ['comment', 'reply', 'thread', 'rating', 'follow'] })),
    // The userstyle this notification is about. Absent for `follow` (no userstyle subject) and for a since-deleted userstyle.
    userstyle: ref({ ref: 'club.userstyles.alpha.defs#userstyleView' }),
    recordUri: required(string({ format: 'at-uri' })),
    author: required(string({ format: 'did' })),
    indexedAt: required(string({ format: 'datetime' })),
  },
});

export default document({
  id: 'club.userstyles.alpha.defs',
  defs: {
    mozDocumentFunction,
    userstyleView,
    profileView,
    ratingView,
    commentView,
    commentThreadView,
    followView,
    relationshipView,
    feedViewItem,
    notificationView,
  },
});
