<script lang="ts">
  import { resolve } from '$app/paths';

  import type { ProfileView } from '$lib/at';

  import Avatar from './ui/Avatar.svelte';

  import { getPreferredActorIdentifier } from '$lib/preferences.svelte';

  interface Props {
    profile: ProfileView;
    style?: 'large' | 'small' | 'minimal';
  }

  let { profile, style = 'large' }: Props = $props();
</script>

<a
  href={resolve('/profile/[user=actor]', { user: getPreferredActorIdentifier(profile) })}
  class={["actor-handle", "actor-handle--style-" + style]}
>
  {#if style !== 'minimal'}
    <Avatar
      src={profile.avatar}
      name={profile.displayName ?? profile.handle}
      alt={profile.handle ?? ''}
      size={style == 'small' ? 'xs' : 'sm'}
    />
  {/if}
  <span class="actor-handle-label">@{profile.handle}</span>
</a>

<style>
  .actor-handle {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-3) var(--space-1) var(--space-1);
    text-decoration: none;

    .actor-handle-label {
      font-weight: 700;
      color: var(--foreground);
      font-family: var(--font-display);
      line-height: 1;

      &:hover {
        color: var(--brand-purple);
      }
    }

    &.actor-handle--style-small,
    &.actor-handle--style-minimal {
      padding: 0;
      flex-shrink: 0;

      .actor-handle-label {
        color: var(--fg-muted);
        font-weight: normal;

        &:hover {
          color: var(--brand-purple);
        }
      }
    }

    &.actor-handle--style-minimal {
      font-size: var(--text-sm);
    }
  }
</style>
