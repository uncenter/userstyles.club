import type { Did } from '@atcute/lexicons';

import {
  listFollowsFromAppview,
  listFollowersFromAppview,
  countFollowsFromAppview,
  countFollowersFromAppview,
  getRelationshipFromAppview,
  getRelationshipsFromAppview,
  type FollowView,
  type FollowsPage,
  type RelationshipView,
} from '../backends/appview/graph';
import type { RepoRecord } from '../records';
import { isAppviewEnabled } from '../settings';
import { ClubUserstylesAlphaGraphFollow } from '@userstyles.club/atcute';

export type Follow = ClubUserstylesAlphaGraphFollow.Main;
export type FollowRecord = RepoRecord<Follow>;
export type { FollowView, FollowsPage, RelationshipView };

export async function listFollows(actor: Did, opts?: { cursor?: string; limit?: number }) {
  if (!isAppviewEnabled()) throw new Error('Follow lists require the appview to be enabled.');
  return await listFollowsFromAppview(actor, opts);
}

export async function listFollowers(actor: Did, opts?: { cursor?: string; limit?: number }) {
  if (!isAppviewEnabled()) throw new Error('Follower lists require the appview to be enabled.');
  return await listFollowersFromAppview(actor, opts);
}

export async function countFollows(actor: Did): Promise<number> {
  if (!isAppviewEnabled()) throw new Error('Follow counts require the appview to be enabled.');
  return await countFollowsFromAppview(actor);
}

export async function countFollowers(actor: Did): Promise<number> {
  if (!isAppviewEnabled()) throw new Error('Follower counts require the appview to be enabled.');
  return await countFollowersFromAppview(actor);
}

export async function getRelationship(actor: Did, other: Did): Promise<RelationshipView> {
  if (!isAppviewEnabled())
    throw new Error('Relationship lookups require the appview to be enabled.');
  return await getRelationshipFromAppview(actor, other);
}

export async function getRelationships(actor: Did, others: Did[]): Promise<RelationshipView[]> {
  if (!isAppviewEnabled())
    throw new Error('Relationship lookups require the appview to be enabled.');
  return await getRelationshipsFromAppview(actor, others);
}
