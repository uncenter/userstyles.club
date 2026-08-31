import { ok } from '@atcute/client';
import type { ActorIdentifier, Did } from '@atcute/lexicons';

import { getCrayonClient } from '../../client';
import type { ClubUserstylesAlphaDefs } from '@userstyles.club/atcute';

export type FollowView = ClubUserstylesAlphaDefs.FollowView;
export type RelationshipView = ClubUserstylesAlphaDefs.RelationshipView;

export type FollowsPage = { follows: FollowView[]; cursor?: string };

export async function listFollowsFromAppview(
  actor: ActorIdentifier,
  opts: { cursor?: string; limit?: number } = {},
): Promise<FollowsPage> {
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.graph.listFollows', {
      params: { actor, cursor: opts.cursor, limit: opts.limit },
    }),
  );
  return { follows: response.follows, cursor: response.cursor };
}

export async function listFollowersFromAppview(
  actor: ActorIdentifier,
  opts: { cursor?: string; limit?: number } = {},
): Promise<FollowsPage> {
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.graph.listFollowers', {
      params: { actor, cursor: opts.cursor, limit: opts.limit },
    }),
  );
  return { follows: response.followers, cursor: response.cursor };
}

export async function countFollowsFromAppview(actor: ActorIdentifier): Promise<number> {
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.graph.countFollows', { params: { actor } }),
  );
  return response.count;
}

export async function countFollowersFromAppview(actor: ActorIdentifier): Promise<number> {
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.graph.countFollowers', { params: { actor } }),
  );
  return response.count;
}

export async function getRelationshipFromAppview(
  actor: Did,
  other: Did,
): Promise<RelationshipView> {
  const client = getCrayonClient();
  return await ok(
    client.get('club.userstyles.alpha.graph.getRelationship', {
      params: { actor, other },
    }),
  );
}

export async function getRelationshipsFromAppview(
  actor: Did,
  others: Did[],
): Promise<RelationshipView[]> {
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.graph.getRelationships', {
      params: { actor, others },
    }),
  );
  return response.relationships;
}
