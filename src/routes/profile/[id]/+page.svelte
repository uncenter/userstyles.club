<script lang="ts">
  import { page } from '$app/state';
  import { followActor, getFollowState, getProfile, unfollowActor, type UserstyleRecord, user, listUserstyles } from '$lib/at';
  import type { AppBskyActorDefs } from '@atcute/bluesky';
  import type { ActorIdentifier } from '@atcute/lexicons';

  import UserstyleListing from '$components/UserstyleListing.svelte';

  let profile = $state<AppBskyActorDefs.ProfileViewDetailed | null>(null);
  let userstyles = $state<UserstyleRecord[]>([]);

  let loading = $state(true);
  let error = $state<string | null>(null);

  let isFollowing = $state(false);
  let followUri = $state<string | null>(null);
  let followLoading = $state(false);

  const actor = $derived(page.params.id);

  $effect(() => {
    if (!actor) return;
    load();
  });

  async function load() {
    loading = true;
    error = null;
    profile = null;

    try {
      profile = await getProfile(actor as ActorIdentifier);

      userstyles = await listUserstyles(profile.did);

      if (user.isLoggedIn && user.did) {
        await checkFollowStatus();
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load profile.';
    } finally {
      loading = false;
    }
  }

  async function checkFollowStatus() {
    if (!profile || !user.did) return;

    const state = await getFollowState(profile.did);
    isFollowing = state.isFollowing;
    followUri = state.followUri;
  }

  async function toggleFollow() {
    if (!user.did || !profile || followLoading) return;

    followLoading = true;
    try {
      if (isFollowing) {
        if (!followUri) throw new Error('Follow URI is missing');
        await unfollowActor(followUri);
        isFollowing = false;
        followUri = null;
      } else {
        const uri = await followActor(profile.did);
        isFollowing = true;
        followUri = uri;
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Follow action failed');
    } finally {
      followLoading = false;
    }
  }
</script>

{#if loading}
  <section class="panel" style="padding: 1rem;">Loading profile...</section>
{:else if error}
  <section class="panel" style="color: #b00020;">{error}</section>
{:else if profile}
  <section class="panel" style="padding: 1rem; display: grid; gap: 1rem;">
    <div style="display: flex; gap: 0.9rem; align-items: center;">
      {#if profile.avatar}
        <img src={profile.avatar} alt={profile.handle} class="avatar" />
      {:else}
        <div class="avatar" style="display: grid; place-items: center; font-weight: 700;">
          {profile.handle[0]?.toUpperCase() ?? '?'}
        </div>
      {/if}

      <div>
        <h1 style="margin: 0; font-size: 1.25rem;">{profile.displayName ?? profile.handle}</h1>
        <p class="muted" style="margin: 0.2rem 0 0;">@{profile.handle}</p>
      </div>
    </div>

    {#if profile.description}
      <p style="margin: 0; line-height: 1.55;">{profile.description}</p>
    {/if}

    <div style="display: flex; gap: 0.8rem; align-items: center; flex-wrap: wrap;">
      <span class="muted">Followers: {profile.followersCount ?? 0}</span>
      <span class="muted">Following: {profile.followsCount ?? 0}</span>
    </div>

    {#if user.isLoggedIn && user.did !== profile.did}
      <button type="button" class="btn primary" onclick={toggleFollow} disabled={followLoading}>
        {followLoading ? 'Working...' : isFollowing ? 'Unfollow' : 'Follow'}
      </button>
    {:else if !user.isLoggedIn}
      <p class="muted" style="margin: 0;">Sign in to follow this profile.</p>
    {/if}
  </section>

  <section class="panel" style="display: grid; gap: 0.75rem;">
    {#if userstyles.length === 0}
      <p class="muted" style="margin: 0;">No userstyles yet.</p>
    {:else}
      {#if error}
        <p style="margin: 0; color: #fca5a5;">{error}</p>
      {:else}
        <ul class="plain">
          {#each userstyles as userstyle}
            <li style="margin-bottom: 0.9rem;">
              <UserstyleListing record={userstyle} />
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
  </section>
{/if}



