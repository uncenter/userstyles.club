import type {
  ActorIdentifier,
  CanonicalResourceUri,
  RecordKey,
  ResourceUri,
} from '@atcute/lexicons';

import {
  countListsFromAppview,
  getListFromAppview,
  getListMembershipsFromAppview,
  getListsFromAppview,
  type ListItemView,
  type ListMembershipView,
  type ListPage,
  type ListsPage,
  type ListView,
} from '../backends/appview/lists';
import { createRecord, deleteRecord, putRecord, type RepoRecord } from '../records';
import { makeRecordBuilder, type RecordCreateInput, type RecordUpdateInput } from '../builder';
import { CLUB_LIST_COLLECTION, CLUB_LISTITEM_COLLECTION, isAppviewEnabled } from '../settings';
import {
  ClubUserstylesAlphaGraphList,
  ClubUserstylesAlphaGraphListitem,
} from '@userstyles.club/atcute';

export type List = ClubUserstylesAlphaGraphList.Main;
export type ListRecord = RepoRecord<List>;
export type ListItem = ClubUserstylesAlphaGraphListitem.Main;
export type ListItemRecord = RepoRecord<ListItem>;
export type { ListView, ListItemView, ListMembershipView, ListsPage, ListPage };

const listBuilder = makeRecordBuilder(
  ClubUserstylesAlphaGraphList.mainSchema,
  CLUB_LIST_COLLECTION,
);
const listItemBuilder = makeRecordBuilder(
  ClubUserstylesAlphaGraphListitem.mainSchema,
  CLUB_LISTITEM_COLLECTION,
);

// No constellation fallback for v1, matching listFollows/listFollowers/getRelationship (also
// graph/relationship data, not core content) -- reads just require the appview to be enabled.

export async function getLists(
  actor: ActorIdentifier,
  opts?: { cursor?: string; limit?: number },
): Promise<ListsPage> {
  if (!isAppviewEnabled()) throw new Error('Lists require the appview to be enabled.');
  return await getListsFromAppview(actor, opts ?? {});
}

export async function getList(
  actor: ActorIdentifier,
  rkey: RecordKey,
  opts?: { cursor?: string; limit?: number },
): Promise<ListPage> {
  if (!isAppviewEnabled()) throw new Error('Lists require the appview to be enabled.');
  return await getListFromAppview(actor, rkey, opts ?? {});
}

export async function getListMemberships(
  actor: ActorIdentifier,
  subject: CanonicalResourceUri,
): Promise<ListMembershipView[]> {
  if (!isAppviewEnabled()) throw new Error('Lists require the appview to be enabled.');
  return await getListMembershipsFromAppview(actor, subject);
}

export async function countLists(actor: ActorIdentifier): Promise<number> {
  if (!isAppviewEnabled()) throw new Error('Lists require the appview to be enabled.');
  return await countListsFromAppview(actor);
}

export async function createList(input: RecordCreateInput<List>) {
  return await createRecord(CLUB_LIST_COLLECTION, listBuilder.create(input));
}

export async function updateList(rkey: RecordKey, input: RecordUpdateInput<List>) {
  return await putRecord(CLUB_LIST_COLLECTION, rkey, listBuilder.update(input));
}

export async function deleteListRecord(rkey: RecordKey): Promise<boolean> {
  return await deleteRecord(CLUB_LIST_COLLECTION, rkey);
}

export async function addUserstyleToList(
  list: ResourceUri,
  subject: { uri: CanonicalResourceUri; cid: string },
) {
  return await createRecord(CLUB_LISTITEM_COLLECTION, listItemBuilder.create({ list, subject }));
}

export async function removeUserstyleFromList(rkey: RecordKey): Promise<boolean> {
  return await deleteRecord(CLUB_LISTITEM_COLLECTION, rkey);
}
