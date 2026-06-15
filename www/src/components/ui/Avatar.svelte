<script lang="ts">
  interface Props {
    src?: string;
    alt?: string;
    name?: string;
    size?: 'sm' | 'md' | 'lg';
  }

  let { src, alt = '', name, size = 'md' }: Props = $props();

  let error = $state(false);
  const initial = $derived((name ?? alt).trim().charAt(0).toUpperCase() || '?');
</script>

<span class="avatar avatar-{size}" aria-label={alt || name || undefined}>
  {#if src && !error}
    <img
      src={size !== 'lg'
        ? src.replace(
            'https://cdn.bsky.app/img/avatar',
            'https://cdn.bsky.app/img/avatar_thumbnail',
          )
        : src}
      {alt}
      onerror={() => (error = true)}
    />
  {:else}
    <span aria-hidden="true">{initial}</span>
  {/if}
</span>

<style>
  .avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--brand-purple-bg);
    color: var(--brand-purple);
    font-family: var(--font-display);
    font-weight: 700;
    overflow: hidden;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    &.avatar-sm {
      width: 2rem;
      height: 2rem;
      font-size: var(--text-xs);
    }
    &.avatar-md {
      width: 2.5rem;
      height: 2.5rem;
      font-size: var(--text-sm);
    }
    &.avatar-lg {
      width: 4.5rem;
      height: 4.5rem;
      font-size: var(--text-2xl);
    }
  }
</style>
