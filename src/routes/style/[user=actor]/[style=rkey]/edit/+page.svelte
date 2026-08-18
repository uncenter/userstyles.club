<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import type { PageProps } from './$types';


  import { getBlobCdnUrl, getUserstyleSourceCode, updateUserstyle, user } from '$lib/at';

  import { BackLink, Loading } from '$components/ui';
  import { Meta } from '$components';

  import UserstyleForm from '../../../../new/UserstyleForm.svelte';

  let { data }: PageProps = $props();
  let userstyle = $derived(data.userstyle.value);

  let title = $derived(userstyle.title);
  let description = $derived(userstyle.description);
  let license = $derived(userstyle.license);
  let upstreamUrl = $derived(userstyle.upstreamUrl);
  let homepageUrl = $derived(userstyle.homepageUrl);
  let sourceCode = $derived(await getUserstyleSourceCode(data.userstyle));

  let trackUpstreamUrl = $derived(upstreamUrl !== undefined);
  let ignoreUpdateUrl = $derived(userstyle.ignoreUpdateUrl ?? !sourceCode.includes('@updateURL'));

  let saving = $state(false);
  let error = $state<string | null>(null);

  let previewFile = $state<File | null>(null);
  let keepExistingPreview = $derived(!!userstyle.previewImage);

  $effect(() => {
    if (!user.isInitializing && !user.isLoggedIn) {
      goto(resolve('/login'));
      return;
    }
    // Redirect non-owners back to the style page.
    if (user.did && user.did !== data.profile.did) {
      goto(resolve('/style/[user=actor]/[style=rkey]', { user: data.user, style: data.style }));
    }
  });

  async function submit(event: Event) {
    event.preventDefault();
    if (saving) return;

    saving = true;
    error = null;

    try {
      await updateUserstyle(data.style, {
        title,
        description,
        license,
        upstreamUrl: trackUpstreamUrl ? upstreamUrl : undefined,
        homepageUrl,
        sourceCode,
        ignoreUpdateUrl,
        previewImage: previewFile ?? (keepExistingPreview ? userstyle.previewImage : undefined),
        createdAt: userstyle.createdAt,
      });
      goto(resolve('/style/[user=actor]/[style=rkey]', { user: data.user, style: data.style }));
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to save userstyle.';
    } finally {
      saving = false;
    }
  }
</script>

<Meta title={['Editing', userstyle.title]} description={`Edit ${userstyle.title} on userstyles.club.`} />

<div class="card">
  <div class="page-header">
    <BackLink
      href={resolve('/style/[user=actor]/[style=rkey]/manage', {
        user: data.user,
        style: data.style,
      })}
      label="Back to Manage"
    />
    <h1>Edit Userstyle</h1>
  </div>
</div>

<div class="card">
  {#snippet formActions()}
    <button
      type="submit"
      class="btn btn--primary"
      disabled={saving || !title.trim() || !sourceCode.trim()}
    >
      <Loading pending={saving} idle="Save" active="Saving…" />
    </button>
    <a
      href={resolve('/style/[user=actor]/[style=rkey]', { user: data.user, style: data.style })}
      class="btn btn--outline"
    >
      Cancel
    </a>
  {/snippet}

  <UserstyleForm
    bind:title
    bind:description
    bind:license
    bind:upstreamUrl
    bind:homepageUrl
    bind:sourceCode
    bind:trackUpstreamUrl
    bind:ignoreUpdateUrl
    bind:previewFile
    bind:keepExistingPreview
    existingImageSrc={userstyle.previewImage
      ? getBlobCdnUrl(data.profile.did, userstyle.previewImage, 'feed_fullsize')
      : null}
    {error}
    onsubmit={submit}
    {formActions}
  />
</div>
