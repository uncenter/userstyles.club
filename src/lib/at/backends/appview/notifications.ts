import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { getCrayonClient } from '../../client';
import type { ClubUserstylesAlphaDefs } from '$lib/at/lexicons';

export type NotificationView = ClubUserstylesAlphaDefs.NotificationView;

export type NotificationsPage = { notifications: NotificationView[]; cursor?: string };

export async function listNotificationsFromAppview(
  actor: Did,
  opts: { cursor?: string; limit?: number } = {},
): Promise<NotificationsPage> {
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.notification.listNotifications', {
      params: { actor, cursor: opts.cursor, limit: opts.limit },
    }),
  );
  return { notifications: response.notifications, cursor: response.cursor };
}
