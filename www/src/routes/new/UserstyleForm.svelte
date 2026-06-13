<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { UserstyleContent } from '$lib/at';
  import type { UserstyleFormFields } from './fields.svelte';
  import { PreviewImageUpload, CssEditor } from '$components';
  import LicenseInput from '$components/LicenseInput.svelte';
  import { Wordmark } from '$components/branding';
  import { Alert } from '$components/ui';

  interface Props extends UserstyleFormFields {
    previewFile?: File | null;
    keepExistingPreview?: boolean;
    existingImageSrc?: string | null;

    error?: string | null;
    onsubmit: (event: Event) => void;

    fieldExtras?: Snippet<[field: keyof UserstyleContent]>;
    formActions: Snippet;
  }

  let {
    title = $bindable(),
    description = $bindable(),
    license = $bindable(),
    homepageUrl = $bindable(),
    sourceCode = $bindable(),
    upstreamUrl = $bindable(undefined),

    trackUpstreamUrl = $bindable(false),
    removeUpdateUrl = $bindable(false),

    previewFile = $bindable(null),
    keepExistingPreview = $bindable(false),
    existingImageSrc = null,

    error = null,
    onsubmit,

    fieldExtras,
    formActions,
  }: Props = $props();
</script>

<form {onsubmit} class="form-stack">
  <div class="form-group">
    <div class="field-row">
      <label for="title" class="field-label">Title</label>
      {@render fieldExtras?.('title')}
    </div>
    <input
      id="title"
      type="text"
      required
      bind:value={title}
      maxlength="140"
      placeholder="e.g. Tangled.org tweaks"
    />
  </div>

  <div class="form-group">
    <div class="field-row">
      <label for="description" class="field-label">Description</label>
      {@render fieldExtras?.('description')}
    </div>
    <input id="description" type="text" bind:value={description} maxlength="300" />
  </div>

  <div class="form-group">
    <div class="field-row">
      <label for="license" class="field-label">License</label>
      {@render fieldExtras?.('license')}
    </div>
    <LicenseInput id="license" bind:value={license} />
  </div>

  <div class="form-group">
    <div class="field-row">
      <label for="homepage-url" class="field-label">Homepage</label>
      {@render fieldExtras?.('homepageUrl')}
    </div>
    <input id="homepage-url" type="url" bind:value={homepageUrl} maxlength="100" />
  </div>

  <PreviewImageUpload
    bind:file={previewFile}
    bind:keepExistingSavedImage={keepExistingPreview}
    {existingImageSrc}
  />

  <div class="form-group">
    <div class="field-row">
      <p class="field-label" data-required>CSS</p>
      {@render fieldExtras?.('sourceCode')}
    </div>
    <CssEditor bind:code={sourceCode} />
  </div>

  <div class="form-group">
    <label class="form-check">
      <input type="checkbox" bind:checked={trackUpstreamUrl} />
      Track
      <input
        class="upstream-url-input"
        type="url"
        bind:value={upstreamUrl}
        aria-label="Upstream source URL"
        aria-describedby="track-upstream-url-desc"
      />
      as upstream source?
    </label>
    <p class="form-hint" id="track-upstream-url-desc">
      This URL can be used for re-syncing source code and metadata later.
    </p>
  </div>

  <div class="form-group">
    <label class="form-check">
      <input
        type="checkbox"
        bind:checked={removeUpdateUrl}
        aria-describedby="remove-update-url-desc"
      />
      Check for updates from <Wordmark --height="1rem" /> instead of original update URL?
    </label>
    <p class="form-hint" id="remove-update-url-desc">
      If there is a configured update URL within the userstyle source code, Stylus will check for
      updates from that URL instead of <strong>userstyles.club</strong>. Removes the
      <code>@updateURL</code> field from the userstyle's metadata.
    </p>
  </div>

  {#if error}
    <Alert variant="error">{error}</Alert>
  {/if}

  <div class="form-footer">
    {@render formActions()}
  </div>
</form>

<style>
  .upstream-url-input {
    display: inline-block;
    width: 20rem;
    max-width: 100%;
    vertical-align: middle;
  }
</style>
