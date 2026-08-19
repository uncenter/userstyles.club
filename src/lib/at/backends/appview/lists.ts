import { ok } from '@atcute/client';
import type { ActorIdentifier, CanonicalResourceUri, RecordKey } from '@atcute/lexicons';

import { getCrayonClient, resolveToDid } from '../../client';
import { toUserstyleView } from './userstyles';
import type { ClubUserstylesAlphaDefs } from '@userstyles.club/atcute';
import type { UserstyleView } from '../../services/userstyles';

export type ListView = ClubUserstylesAlphaDefs.ListView;
export type ListMembershipView = ClubUserstylesAlphaDefs.ListMembershipView;

export type ListItemView = Omit<ClubUserstylesAlphaDefs.ListItemView, 'userstyle'> & {
  userstyle: UserstyleView;
};

export type ListsPage = { lists: ListView[]; cursor?: string };
export type ListPage = { list: ListView; items: ListItemView[]; cursor?: string };

export async function getListsFromAppview(
  actor: ActorIdentifier,
  opts: { cursor?: string; limit?: number } = {},
): Promise<ListsPage> {
  const did = await resolveToDid(actor);
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.graph.getLists', {
      params: { actor: did, cursor: opts.cursor, limit: opts.limit },
    }),
  );
  return { lists: response.lists, cursor: response.cursor };
}

export async function getListFromAppview(
  actor: ActorIdentifier,
  rkey: RecordKey,
  opts: { cursor?: string; limit?: number } = {},
): Promise<ListPage> {
  const did = await resolveToDid(actor);
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.graph.getList', {
      params: { actor: did, rkey, cursor: opts.cursor, limit: opts.limit },
    }),
  );
  return {
    list: response.list,
    items: response.items.map((item) => ({
      ...item,
      userstyle: toUserstyleView(item.userstyle),
    })),
    cursor: response.cursor,
  };
}

export async function getListMembershipsFromAppview(
  actor: ActorIdentifier,
  subject: CanonicalResourceUri,
): Promise<ListMembershipView[]> {
  const did = await resolveToDid(actor);
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.graph.getListMemberships', {
      params: { actor: did, subject },
    }),
  );
  return response.memberships;
}

export async function countListsFromAppview(actor: ActorIdentifier): Promise<number> {
  const did = await resolveToDid(actor);
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.graph.countLists', { params: { actor: did } }),
  );
  return response.count;
}
