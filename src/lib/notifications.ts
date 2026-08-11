import { parseCanonicalResourceUri } from '@atcute/lexicons';
import { resolve } from '$app/paths';

import type { NotificationView, ProfileView } from './at';
import { getPreferredActorIdentifier } from './preferences.svelte';

export function labelForNotification(reason: NotificationView['reason']): string {
  switch (reason) {
    case 'follow':
      return 'followed you';
    case 'comment':
      return 'commented on your userstyle';
    case 'reply':
      return 'replied to your comment';
    case 'thread':
      return 'replied in a thread you\'re in';
    case 'rating':
      return 'rated your userstyle';
  }
}

export function hrefForNotification(n: NotificationView, profile: ProfileView): string {
  if (n.reason === 'follow') {
    return resolve('/profile/[user=actor]', { user: getPreferredActorIdentifier(profile) });
  }
  const { repo, rkey } = parseCanonicalResourceUri(n.subjectUri);
  return resolve('/style/[user=actor]/[style=rkey]', { user: repo, style: rkey });
}
