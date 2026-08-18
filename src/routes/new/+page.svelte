<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  import { parseCanonicalResourceUri } from '@atcute/lexicons';

  import { createUserstyle, user, type UserstyleContent } from '$lib/at';
  import { getPreferredActorIdentifier } from '$lib/preferences.svelte';
  import type { ImportResult } from './import';

  import { Loading, Dialog } from '$components/ui';
  import { BlueskyIcon, Meta } from '$components';

  import ImportFromUrl from './import/ImportFromUrl.svelte';
  import ImportFromFile from './import/ImportFromFile.svelte';
  import UserstyleForm from './UserstyleForm.svelte';

  import { fields } from './fields.svelte';

  let publishing = $state(false);
  let importingUrl = $state(false);
  let importingFile = $state(false);
  let pending = $derived(publishing || importingUrl || importingFile);
  let error = $state<string | null>(null);

  let previewFile = $state<File | null>(null);
  let imported = $state<ImportResult | null>(null);

  let shareDialogOpen = $state(false);
  let clearDialogOpen = $state(false);
  let publishedUrl = $state('');
  let shareText = $state('');

  $effect(() => {
    if (!user.isInitializing && !user.isLoggedIn) {
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
      let userstyle = await createUserstyle({
        title: fields.title,
        description: fields.description,
        license: fields.license,
        upstreamUrl: fields.trackUpstreamUrl ? fields.upstreamUrl : undefined,
        homepageUrl: fields.homepageUrl,
        sourceCode: fields.sourceCode,
        ignoreUpdateUrl: fields.ignoreUpdateUrl,
        previewImage: previewFile ?? undefined,
      });
      let uri = parseCanonicalResourceUri(userstyle.response.uri);
      publishedUrl = `/style/${getPreferredActorIdentifier(user.profile!)}/${uri.rkey}`;
      shareText = `Just published "${fields.title}" on userstyles.club!\n\nhttps://userstyles.club${publishedUrl}`;
      shareDialogOpen = true;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to create userstyle.';
    } finally {
      publishing = false;
    }
  }

  function clearAll() {
    fields.reset();
    imported = null;
    clearDialogOpen = false;
  }

  function goToStyle() {
    shareDialogOpen = false;
    goto(publishedUrl).then(() => fields.reset());
  }

  function openInBluesky() {
    window.open(
      `https://bsky.app/intent/compose?text=${encodeURIComponent(shareText)}`,
      '_blank',
      'noopener,noreferrer',
    );
    goToStyle();
  }
</script>

<Meta title="New Userstyle" description="Publish a new userstyle on userstyles.club." />

<div class="page-section">
  <h1>New Userstyle</h1>
</div>

<div class="import-row">
  <div class="page-section">
    <ImportFromUrl {fields} bind:pending={importingUrl} bind:imported />
  </div>
  <div class="page-section">
    <ImportFromFile {fields} bind:pending={importingFile} bind:imported />
  </div>
</div>

<div class="page-section">
  {#snippet importOverrideButton(field: keyof UserstyleContent)}
    {#if imported}
      {@const importedValue = imported[field]}
      {@const currentValue = fields[field]}
      {#if importedValue && importedValue !== currentValue}
        <button
          type="button"
          class="btn btn--warning btn--sm"
          onclick={() => ((fields as any)[field] = importedValue)}>Import</button
        >
      {/if}
    {/if}
  {/snippet}

  {#snippet formActions()}
    <button
      type="button"
      class="btn btn--danger"
      onclick={() => (clearDialogOpen = true)}
      disabled={pending ||
        (!fields.title.trim() && !fields.description?.trim() && !fields.sourceCode.trim())}
    >
      Clear
    </button>
    <button
      type="submit"
      class="btn btn--primary"
      disabled={pending || !fields.title.trim() || !fields.sourceCode.trim()}
    >
      <Loading pending={publishing} idle="Publish" active="Publishing…" />
    </button>
  {/snippet}

  <UserstyleForm
    bind:title={fields.title}
    bind:description={fields.description}
    bind:license={fields.license}
    bind:homepageUrl={fields.homepageUrl}
    bind:sourceCode={fields.sourceCode}
    bind:upstreamUrl={fields.upstreamUrl}
    bind:trackUpstreamUrl={fields.trackUpstreamUrl}
    bind:ignoreUpdateUrl={fields.ignoreUpdateUrl}
    bind:previewFile
    {error}
    onsubmit={submit}
    fieldExtras={importOverrideButton}
    {formActions}
  />
</div>

<Dialog bind:open={shareDialogOpen} title="Share to Bluesky?" maxWidth="32rem">
  {#snippet children()}
    <p class="text-muted">
      Congratulations on publishing! Let your friends know about your new userstyle.
    </p>
  {/snippet}
  {#snippet actions()}
    <button class="btn btn--outline" type="button" onclick={goToStyle}>Maybe later</button>
    <button class="btn btn--bsky" type="button" onclick={openInBluesky}>
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
    <button class="btn btn--outline" type="button" onclick={() => (clearDialogOpen = false)}
      >Cancel</button
    >
    <button class="btn btn--danger" type="button" onclick={clearAll}>Clear</button>
  {/snippet}
</Dialog>

<style>
  .import-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-5);
    margin-bottom: var(--space-5);

    > .page-section {
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin-bottom: 0;
    }

    @media (max-width: 639px) {
      grid-template-columns: 1fr;
    }
  }
</style>
