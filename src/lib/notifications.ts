import { parseCanonicalResourceUri } from '@atcute/lexicons';
import { resolve } from '$app/paths';

import type { NotificationView, ProfileView } from './at';
import { getPreferredActorIdentifier } from './preferences.svelte';

/** How long the notifications page must stay open before it's marked read. */
export const MARK_NOTIFICATIONS_READ_DELAY_MS = 2500;

/** How often the layout polls for new notifications while the tab is open. */
export const NOTIFICATION_POLL_INTERVAL_MS = 60_000;

export function hrefForNotification(n: NotificationView, profile: ProfileView): string | undefined {
  if (n.reason === 'follow') {
    return resolve('/profile/[user=actor]', { user: getPreferredActorIdentifier(profile) });
  }
  if (!n.userstyle) return undefined;
  const { repo, rkey } = parseCanonicalResourceUri(n.userstyle.uri);
  return resolve('/style/[user=actor]/[style=rkey]', { user: repo, style: rkey });
}
