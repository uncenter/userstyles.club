<script lang="ts">
  import PreviewImage from './PreviewImage.svelte';

  interface Props {
    file?: File | null;
    keepExistingSavedImage?: boolean;
    existingImageSrc?: string | null;
    required?: boolean;
  }

  let {
    file = $bindable(null),
    keepExistingSavedImage = $bindable(false),
    existingImageSrc = null,
    required = false
  }: Props = $props();

  let fileInputEl: HTMLInputElement | undefined;
  let objectUrl = $state<string | null>(null);

  $effect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      objectUrl = url;
      return () => URL.revokeObjectURL(url);
    } else {
      objectUrl = null;
    }
  });

  // Use newly uploaded file first, then fall back to the existing saved preview if not removed.
  let displaySrc = $derived(objectUrl ?? (keepExistingSavedImage ? existingImageSrc : null));
  // Newly uploaded file's filename when one is picked; "Change…" when the pre-existing image is still kept; default placeholder otherwise.
  let displayText = $derived(
    file ? file.name : keepExistingSavedImage && existingImageSrc ? 'Change…' : 'Choose file…'
  );
  // Show the remove button whenever there's something to clear — a newly picked file or the saved image.
  let canRemove = $derived(!!(file || keepExistingSavedImage));

  function handleFileChange(e: Event) {
    file = (e.currentTarget as HTMLInputElement).files?.[0] ?? null;
  }

  function handleRemove() {
    file = null;
    keepExistingSavedImage = false;
    if (fileInputEl) fileInputEl.value = '';
  }
</script>

<div class="form-group">
  <label class="file-label">
    <span class="field-label">Preview Image</span>
    <div class="file-input-row">
      <div class="file-input-wrapper">
        <input
          type="file"
          accept="image/*"
          class="file-input"
          {required}
          bind:this={fileInputEl}
          onchange={handleFileChange}
        />
        <span class="file-input-text">{displayText}</span>
      </div>
      {#if canRemove}
        <button
          type="button"
          class="btn btn-icon btn-outline-danger"
          onclick={handleRemove}
          aria-label="Remove file">✕</button
        >
      {/if}
    </div>
  </label>
  {#if displaySrc}
    <PreviewImage src={displaySrc} />
  {/if}
</div>

<style>
  .file-input-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
</style>
