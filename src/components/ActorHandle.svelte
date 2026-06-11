<script lang="ts">
  import { resolve } from '$app/paths';
  import type { Did } from '@atcute/lexicons';
  import Avatar from './ui/Avatar.svelte';

  interface ProfileLike {
    handle: string;
    displayName?: string;
    avatar?: string;
    did: Did;
  }

  interface Props {
    profile: ProfileLike;
  }

  let { profile }: Props = $props();
</script>

<a href={resolve('/profile/[user=actor]', { user: profile.did })} class="actor-handle">
  <Avatar
    src={profile.avatar}
    name={profile.displayName ?? profile.handle}
    alt={profile.handle ?? ''}
    size="sm"
  />
  <span class="actor-handle-label">@{profile.handle}</span>
</a>

<style>
  .actor-handle {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-3) var(--space-1) var(--space-1);
    text-decoration: none;
    filter: url('#rough');
    transition:
      transform var(--ease-fast),
      box-shadow var(--ease-fast),
      border-color var(--ease-fast);

    .actor-handle-label {
      font-size: var(--text-sm);
      font-weight: 700;
      color: var(--foreground);
      font-family: var(--font-display);
      line-height: 1;

      &:hover {
        color: var(--accent);
      }
    }
  }
</style>
