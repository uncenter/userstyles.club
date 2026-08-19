import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { getCrayonClient } from '../../client';
import type { ClubUserstylesAlphaDefs } from '@userstyles.club/atcute';

export type NotificationView = ClubUserstylesAlphaDefs.NotificationView;

export type NotificationsPage = { notifications: NotificationView[]; cursor?: string };

export async function listNotificationsFromAppview(
  actor: Did,
  opts: { cursor?: string; limit?: number; hydrate?: boolean } = {},
): Promise<NotificationsPage> {
  const client = getCrayonClient();
  const response = await ok(
    client.get('club.userstyles.alpha.notification.listNotifications', {
      params: {
        actor,
        cursor: opts.cursor,
        limit: opts.limit,
        hydrate: opts.hydrate ? ['userstyle'] : undefined,
      },
    }),
  );
  return { notifications: response.notifications, cursor: response.cursor };
}
