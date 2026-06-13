<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import type { PageProps } from './$types';

  import { joinPageTitle } from '$lib/constants';

  import { getBlobCdnUrl, removeUpdateUrlFromSource, updateUserstyle, user } from '$lib/at';

  import { Spinner } from '$components/ui';

  import UserstyleForm from '../../../../new/UserstyleForm.svelte';

  let { data }: PageProps = $props();

  let title = $state(data.userstyle.title);
  let description = $state(data.userstyle.description);
  let license = $state(data.userstyle.license);
  let upstreamUrl = $state(data.userstyle.upstreamUrl);
  let homepageUrl = $state(data.userstyle.homepageUrl);
  let sourceCode = $state(data.userstyle.sourceCode);

  let trackUpstreamUrl = $state(false);
  let removeUpdateUrl = $state(false);

  let saving = $state(false);
  let error = $state<string | null>(null);

  let previewFile = $state<File | null>(null);
  let keepExistingPreview = $state(!!data.userstyle.previewImage);

  $effect(() => {
    if (!user.isLoggedIn) {
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
      let processedSourceCode = removeUpdateUrl ? removeUpdateUrlFromSource(sourceCode) : sourceCode;
      await updateUserstyle(data.style, {
        title,
        description,
        license,
        upstreamUrl: trackUpstreamUrl ? upstreamUrl : undefined,
        homepageUrl,
        sourceCode: processedSourceCode,
        previewImage: previewFile ?? (keepExistingPreview ? data.userstyle.previewImage : undefined),
        createdAt: data.userstyle.createdAt,
      });
      goto(resolve('/style/[user=actor]/[style=rkey]', { user: data.user, style: data.style }));
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to save userstyle.';
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>{joinPageTitle('Editing', data.userstyle.title)}</title>
</svelte:head>

<div class="narrow-col">
  <div class="page-section">
    <h1>Edit Userstyle</h1>
  </div>

  <div class="page-section">
    {#snippet formActions()}
      <button type="submit" class="btn btn-primary" disabled={saving || !title.trim() || !sourceCode.trim()}>
        {#if saving}<Spinner size="sm" /> Saving…{:else}Save{/if}
      </button>
      <a
        href={resolve('/style/[user=actor]/[style=rkey]', { user: data.user, style: data.style })}
        class="btn btn-outline"
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
      bind:removeUpdateUrl

      bind:previewFile
      bind:keepExistingPreview
      existingImageSrc={data.userstyle.previewImage
        ? getBlobCdnUrl(data.profile.did, data.userstyle.previewImage.ref.$link, 'feed_fullsize')
        : null}

      {error}
      onsubmit={submit}
      {formActions}
    />
  </div>
</div>
