<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { createUserstyle, removeUpdateUrlFromSource, user } from '$lib/at';
  import { parseResourceUri } from '@atcute/lexicons';

  import { joinPageTitle } from '$lib/constants';
  import type { StyleImport } from './fetch.remote';

  import { Spinner, Dialog } from '$components/ui';
  import { BlueskyIcon } from '$components';

  import ImportFromUrl from './ImportFromUrl.svelte';
  import UserstyleForm from './UserstyleForm.svelte';

  import { fields, resetFields } from './fields.svelte';

  let publishing = $state(false);
  let importing = $state(false);
  let pending = $derived(publishing || importing);
  let error = $state<string | null>(null);

  let previewFile = $state<File | null>(null);
  let imported = $state<StyleImport | null>(null);

  let shareDialogOpen = $state(false);
  let clearDialogOpen = $state(false);
  let publishedUrl = $state('');
  let shareText = $state('');

  $effect(() => {
    if (!user.isLoggedIn) {
      goto(resolve('/login'));
      return;
    }
  });

  async function submit(event: Event) {
    event.preventDefault();
    if (pending) return;

    publishing = true;
    error = null;

    try {
      const sourceCode = fields.current.removeUpdateUrl
        ? removeUpdateUrlFromSource(fields.current.sourceCode)
        : fields.current.sourceCode;
      let userstyle = await createUserstyle({
        title: fields.current.title,
        description: fields.current.description,
        license: fields.current.license,
        upstreamUrl: fields.current.trackUpstreamUrl ? fields.current.upstreamUrl : undefined,
        homepageUrl: fields.current.homepageUrl,
        sourceCode,
        previewImage: previewFile ?? undefined,
      });
      let uri = parseResourceUri(userstyle.response.uri);
      fields.disconnect();
      publishedUrl = `/style/${uri.repo}/${uri.rkey}`;
      shareText = `Just published "${fields.current.title}" on userstyles.club!\n\nhttps://userstyles.club${publishedUrl}`;
      shareDialogOpen = true;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to create userstyle.';
    } finally {
      publishing = false;
    }
  }

  function clearAll() {
    resetFields();
    imported = null;
    clearDialogOpen = false;
  }

  function skipShare() {
    shareDialogOpen = false;
    goto(publishedUrl);
  }

  function openInBluesky() {
    window.open(
      `https://bsky.app/intent/compose?text=${encodeURIComponent(shareText)}`,
      '_blank',
      'noopener,noreferrer'
    );
    shareDialogOpen = false;
    goto(publishedUrl);
  }
</script>

<svelte:head>
  <title>{joinPageTitle('New Userstyle')}</title>
</svelte:head>

<div class="narrow-col">
  <div class="page-section">
    <h1>New Userstyle</h1>
  </div>

  <div class="page-section">
    <ImportFromUrl {fields} bind:pending={importing} bind:imported />
  </div>

  <div class="page-section">
    {#snippet importOverrideButton(field: keyof StyleImport)}
      {#if imported}
        {@const importedValue = imported[field]}
        {@const currentValue = fields.current[field]}
        {#if importedValue && importedValue !== currentValue}
          <button
            type="button"
            class="btn btn-warning btn-sm"
            onclick={() => (fields.current[field] = importedValue)}
          >Import</button>
        {/if}
      {/if}
    {/snippet}

    {#snippet formActions()}
      <button
        type="button"
        class="btn btn-danger"
        onclick={() => (clearDialogOpen = true)}
        disabled={pending ||
          (!fields.current.title.trim() &&
            !fields.current.description?.trim() &&
            !fields.current.sourceCode.trim())}
      >
        Clear
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        disabled={pending || !fields.current.title.trim() || !fields.current.sourceCode.trim()}
      >
        {#if publishing}<Spinner size="sm" /> Publishing…{:else}Publish{/if}
      </button>
    {/snippet}

    <UserstyleForm
      bind:title={fields.current.title}
      bind:description={fields.current.description}
      bind:license={fields.current.license}
      bind:homepageUrl={fields.current.homepageUrl}
      bind:sourceCode={fields.current.sourceCode}
      bind:upstreamUrl={fields.current.upstreamUrl}
      bind:trackUpstreamUrl={fields.current.trackUpstreamUrl}
      bind:removeUpdateUrl={fields.current.removeUpdateUrl}
      bind:previewFile
      {error}
      onsubmit={submit}
      fieldExtras={importOverrideButton}
      {formActions}
    />
  </div>
</div>

<Dialog bind:open={shareDialogOpen} title="Share to Bluesky?" maxWidth="32rem">
  {#snippet children()}
    <p class="text-muted">
      Congratulations on publishing! Let your friends know about your new userstyle.
    </p>
  {/snippet}
  {#snippet actions()}
    <button class="btn btn-outline" type="button" onclick={skipShare}>Maybe later</button>
    <button class="btn btn-bsky" type="button" onclick={openInBluesky}>
      <BlueskyIcon size={16} /> Open in Bluesky
    </button>
  {/snippet}
</Dialog>

<Dialog bind:open={clearDialogOpen} title="Clear all fields?">
  {#snippet children()}
    <p class="text-muted">
      This will clear all form fields including any imported data. This cannot be undone.
    </p>
  {/snippet}
  {#snippet actions()}
    <button class="btn btn-outline" type="button" onclick={() => (clearDialogOpen = false)}
      >Cancel</button
    >
    <button class="btn btn-danger" type="button" onclick={clearAll}>Clear</button>
  {/snippet}
</Dialog>
