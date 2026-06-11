<script lang="ts">
  import { resolve } from '$app/paths';
  import type { Did } from '@atcute/lexicons';
  import Avatar from './ui/Avatar.svelte';

  type PastelVariant = 'lavender' | 'mint' | 'peach' | 'butter' | 'sky' | 'rose';

  interface ProfileLike {
    handle: string;
    displayName?: string;
    avatar?: string;
    did: Did;
  }

  interface Props {
    profile: ProfileLike;
    variant?: PastelVariant;
  }

  let { profile, variant = 'lavender' }: Props = $props();
</script>

<a
  href={resolve('/profile/[user=actor]', { user: profile.did })}
  class="actor-handle"
  style:--handle-bg="var(--{variant})"
  style:--handle-vivid="var(--{variant}-vivid)"
>
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
    background: var(--handle-bg, var(--lavender));
    border: 2px solid var(--foreground);
    box-shadow: 2px 2px 0 var(--foreground);
    text-decoration: none;
    filter: url('#rough');
    transition:
      transform var(--ease-fast),
      box-shadow var(--ease-fast),
      border-color var(--ease-fast);

    &:hover {
      transform: translate(-1px, -1px);
      border-color: var(--handle-vivid, var(--lavender-vivid));
      box-shadow: 3px 3px 0 var(--handle-vivid, var(--lavender-vivid));
      color: var(--foreground);
    }

    .actor-handle-label {
      font-size: var(--text-sm);
      font-weight: 700;
      color: var(--foreground);
      font-family: var(--font-display);
      line-height: 1;
    }
  }
</style>
