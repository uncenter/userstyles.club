<script lang="ts">
  import type { UserstyleFormState } from '../fields.svelte';

  import { Loading, Alert } from '$components/ui';
  import { FileTextIcon, UploadIcon } from '@lucide/svelte';

  import { applyImportResult, type ImportResult } from '.';

  interface Props {
    fields: UserstyleFormState;
    pending: boolean;
    imported?: ImportResult | null;
  }

  let { fields, pending = $bindable(), imported = $bindable(null) }: Props = $props();

  let fileInputEl: HTMLInputElement | undefined;
  let dragging = $state(false);
  let fileName = $state<string | null>(null);
  let error = $state<string | null>(null);

  async function importFile(file: File) {
    if (pending) return;

    error = null;
    pending = true;

    try {
      const sourceCode = await file.text();
      const result: ImportResult = { sourceCode };

      applyImportResult(fields, result);

      fileName = file.name;
      imported = result;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to import userstyle from file.';
    } finally {
      pending = false;
      if (fileInputEl) fileInputEl.value = '';
    }
  }

  function handleChange(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (file) importFile(file);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) importFile(file);
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragging = true;
  }

  function handleDragLeave() {
    dragging = false;
  }
</script>

<div class="form-group">
  <span class="form-field-label">Upload File</span>
  <label
    class="file-drop-zone"
    class:file-drop-zone--dragging={dragging}
    class:file-drop-zone--disabled={pending}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
  >
    <input
      type="file"
      accept="text/plain,.css,.user.css,text/css,.less,.user.less"
      class="file-drop-zone__input"
      bind:this={fileInputEl}
      disabled={pending}
      onchange={handleChange}
      aria-describedby="import-from-file-desc"
    />
    {#if fileName !== null}
      <FileTextIcon size={28} />
    {:else}
      <UploadIcon size={28} />
    {/if}
    <p class="file-drop-zone__text">
      <Loading
        {pending}
        idle={fileName ? fileName : 'Drag and drop, or click to browse.'}
        active="Reading file…"
      />
    </p>
  </label>
  <p class="form-hint" id="import-from-file-desc">Upload a userstyle CSS file from your device.</p>
</div>

{#if error}
  <Alert variant="error">{error}</Alert>
{/if}

<style>
  .file-drop-zone {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-height: 10rem;
    padding: var(--space-4);
    border: 2px dashed var(--input-border);
    border-radius: var(--radius);
    background: var(--bg-muted);
    color: var(--fg-muted);
    text-align: center;
    cursor: pointer;
    transition:
      border-color var(--ease-fast),
      background-color var(--ease-fast);

    &:hover {
      border-color: var(--ring);
    }

    &.file-drop-zone--dragging {
      border-color: var(--ring);
      background: var(--bg-faint);
      color: var(--foreground);
    }

    &.file-drop-zone--disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .file-drop-zone__input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;

      &:disabled {
        cursor: not-allowed;
      }
    }

    .file-drop-zone__text {
      font-size: var(--text-sm);
      font-weight: 600;
    }
  }
</style>
