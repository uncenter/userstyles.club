<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import type { PageProps } from './$types';

  import { joinPageTitle } from '$lib/constants';

  import { updateUserstyle, user } from '$lib/at';

  import { Spinner, Alert } from '$components/ui';
  import { PreviewImageUpload, CssEditor } from '$components';

  let { data }: PageProps = $props();

  let title = $state(data.userstyle.title);
  let description = $state(data.userstyle.description || '');
  let sourceCode = $state(data.userstyle.sourceCode);
  let saving = $state(false);
  let error = $state<string | null>(null);

  let previewFile = $state<File | null>(null);
  let keepExistingPreview = $state(!!data.userstyle.previewImage);

  $effect(() => {
    if (!user.isLoggedIn) {
      goto(resolve('/login'));
      return;
    }
    // Redirect non-owners back to the style page
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
      await updateUserstyle(
        data.style,
        title,
        description,
        sourceCode,
        data.userstyle.createdAt,
        previewFile ?? (keepExistingPreview ? data.userstyle.previewImage : undefined)
      );
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
    <form onsubmit={submit} class="form-stack">
      <label class="form-group">
        <span class="field-label">Title</span>
        <input
          type="text"
          required
          bind:value={title}
          maxlength="140"
          placeholder="e.g. Tangled.org tweaks"
        />
      </label>

      <label class="form-group">
        <span class="field-label">Description</span>
        <input type="text" bind:value={description} maxlength="300" />
      </label>

      <PreviewImageUpload
        bind:file={previewFile}
        bind:keepExistingSavedImage={keepExistingPreview}
        existingImageSrc={data.previewImageUrl}
      />

      <div class="form-group">
        <p class="field-label" data-required>CSS</p>
        <CssEditor bind:code={sourceCode}/>
      </div>

      {#if error}
        <Alert variant="error">{error}</Alert>
      {/if}

      <div class="form-actions">
        <button
          type="submit"
          class="btn btn-primary"
          disabled={saving || !title.trim() || !sourceCode.trim()}
        >
          {#if saving}<Spinner size="sm" /> Saving…{:else}Save{/if}
        </button>
        <a
          href={resolve('/style/[user=actor]/[style=rkey]', { user: data.user, style: data.style })}
          class="btn btn-outline"
        >
          Cancel
        </a>
      </div>
    </form>
  </div>
</div>

<style>
  .form-actions {
    display: flex;
    gap: var(--space-3);
    align-items: center;
  }
</style>
