import type { RecordEvent } from '@atproto/tap';
import { parseResourceUri } from '@atcute/lexicons';
import { is } from '@atcute/lexicons/validations';

import {
  ClubUserstylesAlphaActorProfile,
  ClubUserstylesAlphaFeedComment,
  ClubUserstylesAlphaFeedRating,
  ClubUserstylesAlphaGraphFollow,
  ClubUserstylesAlphaUserstyle,
} from '../../src/lib/at/lexicons/index.ts';
import { getBlobCid } from '../../src/lib/at/utils.ts';
import {
  createNotification,
  deleteComment,
  deleteFollow,
  deleteProfile,
  deleteRating,
  deleteUserstyle,
  upsertComment,
  upsertFollow,
  upsertProfile,
  upsertRating,
  upsertUserstyle,
} from './db/index.ts';
import { deriveUsercssMetadata } from './usercss.ts';

const USERSTYLE = 'club.userstyles.alpha.userstyle';
const PROFILE = 'club.userstyles.alpha.actor.profile';
const COMMENT = 'club.userstyles.alpha.feed.comment';
const RATING = 'club.userstyles.alpha.feed.rating';
const FOLLOW = 'club.userstyles.alpha.graph.follow';

export const COLLECTIONS = [USERSTYLE, PROFILE, COMMENT, RATING, FOLLOW];

function getDidFromUri(uri: string): string {
  return parseResourceUri(uri).repo;
}

export async function handleRecord(evt: RecordEvent, now: number): Promise<void> {
  if (!COLLECTIONS.includes(evt.collection)) return;
  const uri = `at://${evt.did}/${evt.collection}/${evt.rkey}`;

  if (evt.action === 'delete') {
    switch (evt.collection) {
      case USERSTYLE:
        return deleteUserstyle(uri);
      case PROFILE:
        return deleteProfile(evt.did);
      case COMMENT:
        return deleteComment(uri, now);
      case RATING:
        return deleteRating(uri);
      case FOLLOW:
        return deleteFollow(uri);
    }
    return;
  }

  if (evt.cid === undefined || evt.record === undefined) {
    console.warn(`create/update event at ${uri} missing cid or record body, skipping`);
    return;
  }

  switch (evt.collection) {
    case USERSTYLE:
      return handleUserstyle(uri, evt.cid, evt.did, evt.rkey, evt.record, now);
    case PROFILE:
      return handleProfile(evt.cid, evt.did, evt.record, now);
    case COMMENT:
      return handleComment(uri, evt.cid, evt.did, evt.rkey, evt.record, now);
    case RATING:
      return handleRating(uri, evt.cid, evt.did, evt.rkey, evt.record, now);
    case FOLLOW:
      return handleFollow(uri, evt.cid, evt.did, evt.rkey, evt.record, now);
  }
}

async function handleUserstyle(
  uri: string,
  cid: string,
  did: string,
  rkey: string,
  record: unknown,
  now: number,
): Promise<void> {
  if (!is(ClubUserstylesAlphaUserstyle.mainSchema, record)) {
    console.warn(`skipping malformed userstyle at ${uri}`);
    return;
  }

  const usercss = await deriveUsercssMetadata(did, record.sourceCode);

  await upsertUserstyle({
    uri,
    cid,
    did,
    rkey,
    title: record.title,
    description: record.description ?? null,
    license: record.license ?? null,
    upstreamUrl: record.upstreamUrl ?? null,
    homepageUrl: record.homepageUrl ?? null,
    ignoreUpdateUrl: record.ignoreUpdateUrl ?? false,
    sourceCodeCid: getBlobCid(record.sourceCode),
    previewImageCid: record.previewImage ? getBlobCid(record.previewImage) : null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt ?? null,
    indexedAt: now,
    mozDocumentFunctions: usercss?.mozDocumentFunctions ?? null,
    isConfigurable: usercss?.isConfigurable ?? null,
  });
}

async function handleProfile(cid: string, did: string, record: unknown, now: number): Promise<void> {
  if (!is(ClubUserstylesAlphaActorProfile.mainSchema, record)) {
    console.warn(`skipping malformed profile for ${did}`);
    return;
  }

  await upsertProfile({
    did,
    cid,
    displayName: record.displayName ?? null,
    description: record.description ?? null,
    createdAt: record.createdAt,
    indexedAt: now,
  });
}

async function handleComment(
  uri: string,
  cid: string,
  did: string,
  rkey: string,
  record: unknown,
  now: number,
): Promise<void> {
  if (!is(ClubUserstylesAlphaFeedComment.mainSchema, record)) {
    console.warn(`skipping malformed comment at ${uri}`);
    return;
  }

  const inserted = await upsertComment({
    uri,
    cid,
    did,
    rkey,
    subjectUri: record.subject.uri,
    subjectCid: record.subject.cid,
    parentUri: record.parent?.uri ?? null,
    parentCid: record.parent?.cid ?? null,
    comment: record.comment,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt ?? null,
    indexedAt: now,
  });
  if (!inserted) return;

  // a reply notifies the parent comment's author, a top-level comment notifies the subject userstyle's author.
  const reason = record.parent ? 'reply' : 'comment';
  const subjectUri = record.parent?.uri ?? record.subject.uri;
  const recipientDid = getDidFromUri(subjectUri);
  if (recipientDid !== did) {
    await createNotification({
      recipientDid,
      reason,
      subjectUri,
      recordUri: uri,
      actorDid: did,
      createdAt: now,
    });
  }
}

async function handleRating(
  uri: string,
  cid: string,
  did: string,
  rkey: string,
  record: unknown,
  now: number,
): Promise<void> {
  if (!is(ClubUserstylesAlphaFeedRating.mainSchema, record)) {
    console.warn(`skipping malformed rating at ${uri}`);
    return;
  }

  // rating your own userstyle is rejected
  const subjectDid = getDidFromUri(record.subject.uri);
  if (subjectDid === did) {
    console.warn(`skipping self-rating at ${uri}`);
    return;
  }

  const inserted = await upsertRating({
    uri,
    cid,
    did,
    rkey,
    subjectUri: record.subject.uri,
    subjectCid: record.subject.cid,
    rating: record.rating,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt ?? null,
    indexedAt: now,
  });
  if (!inserted) return;

  await createNotification({
    recipientDid: subjectDid,
    reason: 'rating',
    subjectUri: record.subject.uri,
    recordUri: uri,
    actorDid: did,
    createdAt: now,
  });
}

async function handleFollow(
  uri: string,
  cid: string,
  did: string,
  rkey: string,
  record: unknown,
  now: number,
): Promise<void> {
  if (!is(ClubUserstylesAlphaGraphFollow.mainSchema, record)) {
    console.warn(`skipping malformed follow at ${uri}`);
    return;
  }

  // following yourself is rejected
  if (record.subject === did) {
    console.warn(`skipping self-follow at ${uri}`);
    return;
  }

  const inserted = await upsertFollow({
    uri,
    cid,
    did,
    rkey,
    subjectDid: record.subject,
    createdAt: record.createdAt,
    indexedAt: now,
  });
  if (!inserted) return;

  await createNotification({
    recipientDid: record.subject,
    reason: 'follow',
    subjectUri: uri,
    recordUri: uri,
    actorDid: did,
    createdAt: now,
  });
}
