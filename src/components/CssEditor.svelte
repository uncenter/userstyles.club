<script lang="ts">
  import CodeMirror from 'svelte-codemirror-editor';
  import { css } from '@codemirror/lang-css';
  import { hyperlink } from '$lib/codemirror/hyperlink';
  import { catppuccinLatte, catppuccinMocha } from '@catppuccin/codemirror';

  import { MediaQuery } from 'svelte/reactivity';
  import { preferences } from '$lib/preferences.svelte';

  import { ExpandedDialog } from './ui';
  import { Maximize2Icon } from '@lucide/svelte';

  interface Props {
    code: string;
  }

  let { code = $bindable() }: Props = $props();

  const darkMode = new MediaQuery('(prefers-color-scheme: dark)');
  let fullscreen = $state(false);

  let theme = $derived(
    preferences.get('appearance') === 'dark' ||
      (preferences.get('appearance') === 'system' && darkMode.current)
      ? catppuccinMocha
      : catppuccinLatte,
  );
</script>

<div class="editor-wrap">
  <CodeMirror
    bind:value={() => code, (val) => (code = val)}
    extensions={[hyperlink]}
    lang={css()}
    {theme}
  />
  <button
    class="btn btn--icon btn--outline editor-wrap__expand-btn"
    type="button"
    onclick={() => (fullscreen = true)}
    aria-label="Toggle fullscreen"
  >
    <Maximize2Icon size={16} />
  </button>
</div>

{#if fullscreen}
  <ExpandedDialog bind:open={fullscreen} title="CSS">
    <CodeMirror
      bind:value={() => code, (val) => (code = val)}
      extensions={[hyperlink]}
      lang={css()}
      {theme}
    />
  </ExpandedDialog>
{/if}

<style>
  .editor-wrap {
    position: relative;

    .editor-wrap__expand-btn {
      position: absolute;
      top: var(--space-2);
      right: var(--space-2);
      z-index: 1;
      opacity: 0.6;

      &:hover {
        opacity: 1;
      }
    }
  }

  :global .dialog__body {
    .codemirror-wrapper {
      flex: 1;
      min-height: 0;
      max-height: unset;
    }

    .cm-editor {
      height: 100%;
    }

    .cm-scroller {
      height: 100%;
    }

    .cm-content,
    .cm-gutter {
      min-height: unset !important;
    }
  }

  :global .codemirror-wrapper {
    display: flex;
    border: 2px solid var(--input-border);
    border-radius: var(--radius-sm);
    overflow: hidden;
    transition:
      border-color var(--ease-fast),
      box-shadow var(--ease-fast);
    max-height: 24rem;

    &:focus-within {
      border-color: var(--ring);
      box-shadow: 3px 3px 0 var(--brand-purple);
    }

    .cm-editor {
      width: 0;
      flex-grow: 1;
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      background: var(--bg-subtle) !important;
      color: var(--foreground) !important;

      .cm-content,
      .cm-gutter {
        min-height: 8rem;
      }
      .cm-gutters {
        margin: 0;
        background: var(--bg-muted) !important;
        color: var(--fg-muted) !important;
        border-right: 2px solid var(--border) !important;
      }
      .cm-scroller {
        overflow: auto;
      }
      .cm-activeLine {
        background: color-mix(in srgb, var(--brand-purple) 8%, transparent) !important;
      }
      .cm-activeLineGutter {
        background: color-mix(in srgb, var(--brand-purple) 12%, transparent) !important;
      }
      .cm-cursor,
      .cm-dropCursor {
        border-left-color: var(--brand-purple) !important;
      }
      .cm-selectionBackground {
        background: color-mix(in srgb, var(--brand-purple) 25%, transparent) !important;
      }
      &.cm-focused .cm-selectionBackground {
        background: color-mix(in srgb, var(--brand-purple) 30%, transparent) !important;
      }
    }
  }
</style>
