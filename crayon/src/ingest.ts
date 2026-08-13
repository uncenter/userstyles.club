import type { TapRecordEvent } from '@atcute/tap';
import { parseResourceUri } from '@atcute/lexicons';
import { safeParse, type BaseSchema, type InferOutput } from '@atcute/lexicons/validations';

import {
  ClubUserstylesAlphaActorProfile,
  ClubUserstylesAlphaFeedComment,
  ClubUserstylesAlphaFeedRating,
  ClubUserstylesAlphaGraphFollow,
  ClubUserstylesAlphaUserstyle,
} from '@userstyles.club/atcute';
import { getBlobCid } from './utils.ts';
import {
  createNotification,
  deleteComment,
  deleteFollow,
  deleteProfile,
  deleteRating,
  deleteUserstyle,
  getThreadAncestorAuthors,
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

type UserstyleRecord = InferOutput<typeof ClubUserstylesAlphaUserstyle.mainSchema>;
type ProfileRecord = InferOutput<typeof ClubUserstylesAlphaActorProfile.mainSchema>;
type CommentRecord = InferOutput<typeof ClubUserstylesAlphaFeedComment.mainSchema>;
type RatingRecord = InferOutput<typeof ClubUserstylesAlphaFeedRating.mainSchema>;
type FollowRecord = InferOutput<typeof ClubUserstylesAlphaGraphFollow.mainSchema>;

function getDidFromUri(uri: string): string {
  return parseResourceUri(uri).repo;
}

function validateRecord<TSchema extends BaseSchema>(
  nsid: string,
  uri: string,
  schema: TSchema,
  input: unknown,
): InferOutput<TSchema> | undefined {
  const parsed = safeParse(schema, input);
  if (!parsed.ok) {
    console.warn(`skipping malformed ${nsid} at ${uri}: ${parsed.message}`);
    return undefined;
  }
  return parsed.value;
}

export async function handleRecord(evt: TapRecordEvent, now: number): Promise<void> {
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

  if (evt.record === undefined) {
    console.warn(`create/update event at ${uri} missing record body, skipping`);
    return;
  }
  const { cid, did, rkey } = evt;

  switch (evt.collection) {
    case USERSTYLE: {
      const record = validateRecord(
        evt.collection,
        uri,
        ClubUserstylesAlphaUserstyle.mainSchema,
        evt.record,
      );
      return record ? handleUserstyle(uri, cid, did, rkey, record, now) : undefined;
    }
    case PROFILE: {
      const record = validateRecord(
        evt.collection,
        uri,
        ClubUserstylesAlphaActorProfile.mainSchema,
        evt.record,
      );
      return record ? handleProfile(cid, did, record, now) : undefined;
    }
    case COMMENT: {
      const record = validateRecord(
        evt.collection,
        uri,
        ClubUserstylesAlphaFeedComment.mainSchema,
        evt.record,
      );
      return record ? handleComment(uri, cid, did, rkey, record, now) : undefined;
    }
    case RATING: {
      const record = validateRecord(
        evt.collection,
        uri,
        ClubUserstylesAlphaFeedRating.mainSchema,
        evt.record,
      );
      return record ? handleRating(uri, cid, did, rkey, record, now) : undefined;
    }
    case FOLLOW: {
      const record = validateRecord(
        evt.collection,
        uri,
        ClubUserstylesAlphaGraphFollow.mainSchema,
        evt.record,
      );
      return record ? handleFollow(uri, cid, did, rkey, record, now) : undefined;
    }
  }
}

async function handleUserstyle(
  uri: string,
  cid: string,
  did: string,
  rkey: string,
  record: UserstyleRecord,
  now: number,
): Promise<void> {
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
    userCssVars: usercss?.userCssVars ?? null,
  });
  console.log(`indexed userstyle at ${uri}`);
}

async function handleProfile(
  cid: string,
  did: string,
  record: ProfileRecord,
  now: number,
): Promise<void> {
  await upsertProfile({
    did,
    cid,
    description: record.description ?? null,
    createdAt: record.createdAt,
    indexedAt: now,
  });
  console.log(`indexed profile for ${did}`);
}

async function handleComment(
  uri: string,
  cid: string,
  did: string,
  rkey: string,
  record: CommentRecord,
  now: number,
): Promise<void> {
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
  console.log(`indexed comment at ${uri}`);

  // A top-level comment notifies the userstyle's owner.
  // A reply also notifies the parent comment's author, plus everyone else already participating in the thread above it.s
  const notified = new Set<string>([did]); // never notify the actor about their own comment

  async function notify(recipientDid: string, reason: 'reply' | 'thread' | 'comment') {
    if (notified.has(recipientDid)) return;
    notified.add(recipientDid);
    await createNotification({
      recipientDid,
      reason,
      userstyleUri: record.subject.uri,
      recordUri: uri,
      actorDid: did,
      createdAt: record.createdAt,
      indexedAt: now,
    });
  }

  if (record.parent) {
    await notify(getDidFromUri(record.parent.uri), 'reply');
    for (const ancestorDid of await getThreadAncestorAuthors(record.parent.uri)) {
      await notify(ancestorDid, 'thread');
    }
  }

  await notify(getDidFromUri(record.subject.uri), 'comment');
}

async function handleRating(
  uri: string,
  cid: string,
  did: string,
  rkey: string,
  record: RatingRecord,
  now: number,
): Promise<void> {
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
  console.log(`indexed rating at ${uri}`);

  await createNotification({
    recipientDid: subjectDid,
    reason: 'rating',
    userstyleUri: record.subject.uri,
    recordUri: uri,
    actorDid: did,
    createdAt: record.createdAt,
    indexedAt: now,
  });
}

async function handleFollow(
  uri: string,
  cid: string,
  did: string,
  rkey: string,
  record: FollowRecord,
  now: number,
): Promise<void> {
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
  console.log(`indexed follow at ${uri}`);

  await createNotification({
    recipientDid: record.subject,
    reason: 'follow',
    recordUri: uri,
    actorDid: did,
    createdAt: record.createdAt,
    indexedAt: now,
  });
}
