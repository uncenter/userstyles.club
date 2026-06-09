<script lang="ts">
  import type { PageProps } from './$types';
  import { joinPageTitle } from '$lib/constants';

  import { Alert, Avatar, UserstylesList } from '$components';

  let error = $state<string | null>(null);

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>{joinPageTitle(`@${data.profile.handle}`)}</title>
</svelte:head>

<div class="narrow-col">
  <section class="page-section profile-header">
    <Avatar
      src={data.profile.avatar}
      alt={data.profile.handle}
      name={data.profile.displayName ?? data.profile.handle}
      size="lg"
    />
    <div class="profile-info">
      <h1>{data.profile.displayName ?? data.profile.handle}</h1>
      <div class="profile-handle-row">
        <p class="text-muted">@{data.profile.handle}</p>
        <a
          class="bsky-link"
          href="https://bsky.app/profile/{data.profile.handle}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View on Bluesky"
        >
          <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M5.202 2.857C7.954 4.922 10.913 9.11 12 11.358c1.087-2.247 4.046-6.436 6.798-8.501C20.783 1.366 24 .213 24 3.883c0 .732-.42 6.156-.667 7.037-.856 3.061-3.978 3.842-6.755 3.37 4.854.826 6.089 3.562 3.422 6.299-5.065 5.196-7.28-1.304-7.847-2.97-.104-.305-.152-.448-.153-.327 0-.121-.05.022-.153.327-.568 1.666-2.782 8.166-7.847 2.97-2.667-2.737-1.432-5.473 3.422-6.3-2.777.473-5.899-.308-6.755-3.369C.42 10.04 0 4.615 0 3.883c0-3.67 3.217-2.517 5.202-1.026"/>
          </svg>
        </a>
      </div>
    </div>
    {#if data.profile.description}
      <p class="profile-bio">{data.profile.description}</p>
    {/if}
  </section>
</div>

<section class="profile-userstyles">
  {#if error}
    <Alert variant="error">{error}</Alert>
  {:else if data.userstyles.length === 0}
    <p class="text-muted">No userstyles yet.</p>
  {:else}
    <UserstylesList userstyles={data.userstyles} />
  {/if}
</section>

<style>
  .profile-userstyles {
    margin-top: var(--space-6);
    margin-bottom: var(--space-5);
  }

  .profile-header {
    --card-border: var(--border);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    background: var(--lavender);

    .profile-info {
      display: grid;
      gap: var(--space-1);

      h1 {
        font-size: var(--text-2xl);
      }
    }

    .profile-handle-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .bsky-link {
      display: inline-flex;
      align-items: center;
      color: var(--fg-muted);
      transition: color var(--ease-fast);

      svg {
        width: 1rem;
        height: 1rem;
        fill: currentColor;
      }

      &:hover {
        color: #1185fe;
      }
    }

    .profile-bio {
      color: var(--fg-muted);
      line-height: 1.6;
      margin-top: var(--space-1);
    }
  }
</style>
