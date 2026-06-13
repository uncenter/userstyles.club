<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { createUserstyle, user } from '$lib/at';
  import { parseResourceUri } from '@atcute/lexicons';

  import { joinPageTitle } from '$lib/constants';
  import type { StyleImport } from './fetch.remote';

  import { Wordmark } from '$components/branding';
  import { Spinner, Alert, Dialog } from '$components/ui';
  import { PreviewImageUpload, BlueskyIcon, CssEditor } from '$components';

  import ImportFromUrl from './ImportFromUrl.svelte';

  import { fields } from './fields.svelte';
  import LicenseInput from '$components/LicenseInput.svelte';

  let publishing = $state(false);
  let importing = $state(false);
  let pending = $derived(publishing || importing);
  let error = $state<string | null>(null);

  let previewImage = $state<File | null>(null);
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
      let sourceCode = fields.current.sourceCode;
      if (fields.current.removeUpdateUrl) {
        sourceCode = sourceCode
          .split('\n')
          .filter((line) => !/^\s*@updateURL\s/.test(line))
          .join('\n');
      }
      let userstyle = await createUserstyle(
        {
          title: fields.current.title,
          description: fields.current.description,
          license: fields.current.license,
          sourceCode,
          previewImage: previewImage ?? undefined,
        }
      );
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
    fields.current = {
      title: '',
      description: '',
      license: '',
      sourceCode: '',
      importUrl: '',
      upstreamUrl: '',
      homepageUrl: '',
      removeUpdateUrl: true
    };
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
    {#snippet importOverrideButton(condition: boolean, apply: () => void)}
      {#if condition}
        <button type="button" class="btn btn-warning btn-sm" onclick={apply}>Import</button>
      {/if}
    {/snippet}

    <form onsubmit={submit} class="form-stack">
      <div class="form-group">
        <div class="field-row">
          <label for="title" class="field-label">Title</label>
          {@render importOverrideButton(
            Boolean(imported?.title && imported.title !== fields.current.title),
            () => (fields.current.title = imported!.title!)
          )}
        </div>
        <input
          id="title"
          type="text"
          required
          bind:value={() => fields.current.title, (val) => (fields.current.title = val)}
          maxlength="140"
          placeholder="e.g. Tangled.org tweaks"
        />
      </div>

      <div class="form-group">
        <div class="field-row">
          <label for="description" class="field-label">Description</label>
          {@render importOverrideButton(
            Boolean(imported?.description && imported.description !== fields.current.description),
            () => (fields.current.description = imported!.description!)
          )}
        </div>
        <input
          id="description"
          type="text"
          bind:value={() => fields.current.description, (val) => (fields.current.description = val)}
          maxlength="300"
        />
      </div>

      <div class="form-group">
        <div class="field-row">
          <label for="license" class="field-label">License</label>
          {@render importOverrideButton(
            Boolean(imported?.license && imported.license !== fields.current.license),
            () => (fields.current.license = imported!.license!)
          )}
        </div>
        <LicenseInput id="license" bind:value={() => fields.current.license, (val) => (fields.current.license = val)} />
      </div>

      <div class="form-group">
        <div class="field-row">
          <label for="homepage-url" class="field-label">Homepage</label>
          {@render importOverrideButton(
            Boolean(imported?.homepageUrl && imported.homepageUrl !== fields.current.homepageUrl),
            () => (fields.current.homepageUrl = imported!.homepageUrl!)
          )}
        </div>
        <input
          id="homepage-url"
          type="url"
          bind:value={() => fields.current.homepageUrl, (val) => (fields.current.homepageUrl = val)}
          maxlength="100"
        />
      </div>

      <PreviewImageUpload bind:file={previewImage} />

      <div class="form-group">
        <div class="field-row">
          <p class="field-label" data-required>CSS</p>
          {@render importOverrideButton(
            Boolean(imported?.code && imported.code !== fields.current.sourceCode),
            () => (fields.current.sourceCode = imported!.code!)
          )}
        </div>
        <CssEditor bind:code={fields.current.sourceCode} />
      </div>

      <div class="form-group">
        <label class="form-check">
          <input
            type="checkbox"
            bind:checked={
              () => fields.current.removeUpdateUrl, (val) => (fields.current.removeUpdateUrl = val)
            }
            aria-describedby="remove-update-url-desc"
          />
          <span
            >Check for updates from <Wordmark --height="1rem" /> instead of original update URL?</span
          >
        </label>
        <p class="form-hint" id="remove-update-url-desc">
          If there is a configured update URL within the userstyle source code, Stylus will check
          for updates from that URL instead of <strong>userstyles.club</strong>. Removes the
          <code>@updateURL</code> field from the userstyle's metadata.
        </p>
      </div>

      <div class="form-footer">
        <button
          type="button"
          class="btn btn-danger"
          onclick={() => (clearDialogOpen = true)}
          disabled={pending ||
            (!fields.current.title.trim() &&
              !fields.current.description.trim() &&
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
      </div>

      {#if error}
        <Alert variant="error">{error}</Alert>
      {/if}
    </form>
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
