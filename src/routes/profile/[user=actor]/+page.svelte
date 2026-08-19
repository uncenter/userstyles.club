<script lang="ts">
  import type { PageProps } from './$types';
  import { resolve } from '$app/paths';
  import { getPreferredActorIdentifier, formatActorLabel } from '$lib/preferences.svelte';

  import { parseCanonicalResourceUri, type ResourceUri } from '@atcute/lexicons';

  import {
    user,
    setClubProfile,
    followActor,
    unfollowActor,
    getRelationship,
    CLUB_PROFILE_COLLECTION,
  } from '$lib/at';

  import { Alert, Avatar, Loading } from '$components/ui';
  import { UserstylesSection, ListsSection, BlueskyIcon, Meta } from '$components';

  import { PencilIcon, UserPlusIcon, UserMinusIcon } from '@lucide/svelte';

  let { data }: PageProps = $props();

  let isOwner = $derived(user.isLoggedIn && user.did === data.profile.did);
  let canFollow = $derived(user.isLoggedIn && user.did && user.did !== data.profile.did);

  let identityLabel = $derived(data.profile.handle ?? data.profile.did);
  let description = $derived(data.profile.description);

  let following = $derived<ResourceUri | undefined>(
    canFollow
      ? await getRelationship(user.did!, data.profile.did)
          .then((rel) => rel.following)
          .catch(() => undefined)
      : undefined,
  );
  let followLoading = $state(false);
  let followError = $state<string | null>(null);

  async function toggleFollow() {
    if (!user.isLoggedIn || followLoading) return;
    followLoading = true;
    followError = null;
    try {
      if (following) {
        const { rkey } = parseCanonicalResourceUri(following);
        await unfollowActor(rkey);
        following = undefined;
      } else {
        const created = await followActor(data.profile.did);
        following = created.response.uri;
      }
    } catch (e) {
      followError = e instanceof Error ? e.message : 'Failed to update follow.';
    } finally {
      followLoading = false;
    }
  }

  let editing = $state(false);
  let editDescription = $state('');

  let saving = $state(false);
  let saveError = $state<string | null>(null);

  function startEditing() {
    editDescription = description ?? '';
    saveError = null;
    editing = true;
  }

  async function saveProfile(event: Event) {
    event.preventDefault();
    if (saving) return;

    saving = true;
    saveError = null;

    try {
      await setClubProfile({ description: editDescription }, data.profile.club?.createdAt);
      description = editDescription;
      editing = false;
    } catch (e) {
      saveError = e instanceof Error ? e.message : 'Failed to save profile.';
    } finally {
      saving = false;
    }
  }
</script>

<Meta
  title={formatActorLabel(data.profile)}
  description={description || `${formatActorLabel(data.profile)}'s profile on userstyles.club.`}
  image={data.profile.avatar}
  imageAlt={identityLabel}
  imageSize="small"
  type="profile"
/>
<svelte:head>
  <meta name="at:canonical" content={`at://${data.profile.did}/${CLUB_PROFILE_COLLECTION}/self`} />
</svelte:head>

<section class="card profile-header">
  <Avatar src={data.profile.avatar} alt={identityLabel} name={identityLabel} size="lg" />
  {#if editing}
    <form onsubmit={saveProfile} class="form-stack profile-edit-form">
      <div class="form-group">
        <label for="edit-description" class="form-field-label">Description</label>
        <textarea id="edit-description" bind:value={editDescription} maxlength="256" rows="3"
        ></textarea>
      </div>
      {#if saveError}
        <Alert variant="error">{saveError}</Alert>
      {/if}
      <div class="form-footer">
        <button
          type="button"
          class="btn btn--outline"
          onclick={() => (editing = false)}
          disabled={saving}
        >
          Cancel
        </button>
        <button type="submit" class="btn btn--primary" disabled={saving}>
          <Loading pending={saving} idle="Save" active="Saving…" />
        </button>
      </div>
    </form>
  {:else}
    <div class="profile-header__info">
      <div class="profile-header__handle-row">
        <h1 class="profile-header__name">{formatActorLabel(data.profile)}</h1>
        {#if data.profile.bsky}
          <a
            class="profile-header__bsky-link"
            href="https://bsky.app/profile/{identityLabel}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on Bluesky"
          >
            <BlueskyIcon size={16} />
          </a>
        {/if}
      </div>
      {#if description}
        <p class="profile-header__description">{description}</p>
      {/if}
    </div>
    <div class="profile-header__side">
      <div class="profile-header__follow-counts">
        <a
          class="link link--quiet link--muted link--sm"
          href={resolve('/profile/[user=actor]/followers', {
            user: getPreferredActorIdentifier(data.profile),
          })}
        >
          <strong>{data.followerCount ?? '-'}</strong> Followers
        </a>
        <a
          class="link link--quiet link--muted link--sm"
          href={resolve('/profile/[user=actor]/following', {
            user: getPreferredActorIdentifier(data.profile),
          })}
        >
          <strong>{data.followingCount ?? '-'}</strong> Following
        </a>
      </div>
      {#if canFollow}
        <button
          type="button"
          class={['btn', 'btn--sm', following ? 'btn--outline' : 'btn--primary']}
          disabled={followLoading}
          onclick={toggleFollow}
        >
          <Loading pending={followLoading} active={following ? 'Unfollowing…' : 'Following…'}>
            {#snippet idle()}
              {#if following}<UserMinusIcon size={14} /> Unfollow{:else}<UserPlusIcon size={14} /> Follow{/if}
            {/snippet}
          </Loading>
        </button>
      {/if}
    </div>
    {#if isOwner}
      <button
        type="button"
        class="btn btn--ghost btn--icon profile-header__edit-btn"
        aria-label="Edit profile"
        onclick={startEditing}
      >
        <PencilIcon size={14} />
      </button>
    {/if}
    {#if followError}
      <div class="profile-header__error"><Alert variant="error">{followError}</Alert></div>
    {/if}
  {/if}
</section>

<UserstylesSection userstyles={data.userstyles} author={data.profile} />

{#if data.lists}
  <div class="lists-section-header">
    <h2>Lists</h2>
    {#if data.lists.cursor}
      <a
        class="link link--quiet link--muted link--sm"
        href={resolve('/profile/[user=actor]/lists', {
          user: getPreferredActorIdentifier(data.profile),
        })}
      >
        View all →
      </a>
    {/if}
  </div>
  <ListsSection lists={data.lists.lists} owner={data.profile}>
    {#snippet empty()}No lists yet.{/snippet}
  </ListsSection>
{/if}

<style>
  .lists-section-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    margin-top: var(--space-8);
  }

  .profile-header {
    --card-border: var(--border);
    position: relative;
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: var(--space-4);
    background: var(--bg-subtle);

    .profile-header__edit-btn {
      position: absolute;
      bottom: var(--space-3);
      right: var(--space-3);
    }

    .profile-header__info {
      display: grid;
      gap: var(--space-1);
      flex: 1;
      min-width: 12rem;

      .profile-header__name {
        margin: 0;
        font-size: var(--text-2xl);
      }
    }

    .profile-header__handle-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .profile-header__bsky-link {
      display: inline-flex;
      align-items: center;
      color: var(--fg-muted);
      transition: color var(--ease-fast);

      &:hover {
        color: var(--bsky-accent);
      }
    }

    .profile-header__description {
      color: var(--fg-muted);
      line-height: 1.6;
      margin-top: var(--space-1);
    }

    .profile-header__side {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--space-3);
      flex-shrink: 0;
    }

    .profile-header__follow-counts {
      display: flex;
      gap: var(--space-3);

      strong {
        color: var(--foreground);
      }
    }

    .profile-edit-form {
      width: 100%;
    }

    .profile-header__error {
      flex-basis: 100%;
    }

    @media (max-width: 639px) {
      flex-direction: column;

      .profile-header__side {
        align-items: flex-start;
        width: 100%;
      }
    }
  }
</style>
