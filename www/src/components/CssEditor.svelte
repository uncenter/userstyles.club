<script lang="ts">
  import CodeMirror from 'svelte-codemirror-editor';
  import { css } from '@codemirror/lang-css';
  import { hyperlink } from '$lib/codemirror/hyperlink';
  import { catppuccinLatte, catppuccinMocha } from '@catppuccin/codemirror';

  import { preferences } from '$lib/preferences.svelte';

  import { ExpandedDialog } from './ui';
  import { Maximize2Icon } from '@lucide/svelte';

  interface Props {
    code: string;
  }

  let { code = $bindable() }: Props = $props();

  let prefersDark = $state(window.matchMedia('(prefers-color-scheme: dark)').matches);
  let fullscreen = $state(false);

  $effect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      prefersDark = e.matches;
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  });

  let theme = $derived(
    preferences.get('appearance') === 'dark' ||
      (preferences.get('appearance') === 'system' && prefersDark)
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
    class="btn btn-icon btn-outline expand-btn"
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
  }

  .expand-btn {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    z-index: 1;
    opacity: 0.6;

    &:hover {
      opacity: 1;
    }
  }

  :global .dialog-body {
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
    overflow: hidden;
    transition:
      border-color var(--ease-fast),
      box-shadow var(--ease-fast);
    max-height: 24rem;

    &:focus-within {
      border-color: var(--ring);
      box-shadow: 3px 3px 0 var(--accent);
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
        background: color-mix(in srgb, var(--accent) 8%, transparent) !important;
      }
      .cm-activeLineGutter {
        background: color-mix(in srgb, var(--accent) 12%, transparent) !important;
      }
      .cm-cursor,
      .cm-dropCursor {
        border-left-color: var(--accent) !important;
      }
      .cm-selectionBackground {
        background: color-mix(in srgb, var(--accent) 25%, transparent) !important;
      }
      &.cm-focused .cm-selectionBackground {
        background: color-mix(in srgb, var(--accent) 30%, transparent) !important;
      }
    }
  }
</style>
