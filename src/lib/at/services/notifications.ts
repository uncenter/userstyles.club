import type { Did } from '@atcute/lexicons';

import {
  listNotificationsFromAppview,
  type NotificationView,
  type NotificationsPage,
} from '../backends/appview/notifications';
import { isAppviewEnabled } from '../settings';

export type { NotificationView, NotificationsPage };

export async function listNotifications(
  actor: Did,
  opts?: { cursor?: string; limit?: number },
): Promise<NotificationsPage> {
  if (!isAppviewEnabled()) throw new Error('Notifications require the appview to be enabled.');
  return await listNotificationsFromAppview(actor, opts);
}
