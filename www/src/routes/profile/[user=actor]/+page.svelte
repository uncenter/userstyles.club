<script lang="ts">
  import type { PageProps } from './$types';
  import { joinPageTitle } from '$lib/constants';

  import { invalidateAll } from '$app/navigation';

  import { user, setClubProfile } from '$lib/at';

  import { Alert, Avatar, Spinner } from '$components/ui';
  import { UserstylesSection, BlueskyIcon } from '$components';

  import { PencilIcon } from '@lucide/svelte';

  let { data }: PageProps = $props();

  let isOwner = $derived(user.isLoggedIn && user.did === data.profile.did);

  let displayName = $derived(data.profile.displayName || data.profile.handle);
  let description = $derived(data.profile.description);

  let editing = $state(false);
  let editDisplayName = $state('');
  let editDescription = $state('');

  let saving = $state(false);
  let saveError = $state<string | null>(null);

  function startEditing() {
    editDisplayName = data.profile.displayName ?? '';
    editDescription = data.profile.description ?? '';
    saveError = null;
    editing = true;
  }

  async function saveProfile(event: Event) {
    event.preventDefault();
    if (saving) return;

    saving = true;
    saveError = null;

    try {
      await setClubProfile({ displayName: editDisplayName, description: editDescription }, data.profile.club?.createdAt);
      await invalidateAll();
      editing = false;
    } catch (e) {
      saveError = e instanceof Error ? e.message : 'Failed to save profile.';
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>{joinPageTitle(`@${data.profile.handle}`)}</title>
</svelte:head>

<section class="page-section profile-header">
  <Avatar src={data.profile.avatar} alt={data.profile.handle} name={displayName} size="lg" />
  {#if editing}
    <form onsubmit={saveProfile} class="form-stack profile-edit-form">
      <div class="form-group">
        <label for="edit-display-name" class="field-label">Display name</label>
        <input
          id="edit-display-name"
          type="text"
          bind:value={editDisplayName}
          maxlength="64"
          placeholder={data.profile.bsky.displayName ?? data.profile.handle}
        />
      </div>
      <div class="form-group">
        <label for="edit-description" class="field-label">Description</label>
        <textarea id="edit-description" bind:value={editDescription} maxlength="256" rows="3"
        ></textarea>
      </div>
      {#if saveError}
        <Alert variant="error">{saveError}</Alert>
      {/if}
      <div class="form-footer">
        <button
          type="button"
          class="btn btn-outline"
          onclick={() => (editing = false)}
          disabled={saving}
        >
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" disabled={saving}>
          {#if saving}<Spinner size="sm" /> Saving…{:else}Save{/if}
        </button>
      </div>
    </form>
  {:else}
    <div class="profile-info">
      <h1>{displayName}</h1>
      <div class="profile-handle-row">
        <p class="text-muted">@{data.profile.handle}</p>
        <a
          class="bsky-link"
          href="https://bsky.app/profile/{data.profile.handle}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View on Bluesky"
        >
          <BlueskyIcon size={16} />
        </a>
      </div>
    </div>
    {#if description}
      <p class="profile-description">{description}</p>
    {/if}
    {#if isOwner}
      <button type="button" class="btn btn-ghost btn-sm edit-profile-btn" onclick={startEditing}>
        <PencilIcon size={14} /> Edit Profile
      </button>
    {/if}
  {/if}
</section>

<UserstylesSection userstyles={data.userstyles} author={data.profile} />

<style>
  .profile-header {
    --card-border: var(--border);
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    background: var(--bg-subtle);

    .edit-profile-btn {
      position: absolute;
      top: var(--space-3);
      right: var(--space-3);
    }

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

      &:hover {
        color: var(--bsky-blue);
      }
    }

    .profile-description {
      color: var(--fg-muted);
      line-height: 1.6;
      margin-top: var(--space-1);
    }

    .profile-edit-form {
      width: 100%;
    }
  }
</style>
