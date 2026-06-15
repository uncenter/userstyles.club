<!-- Component adapted from https://github.com/joeltg/react-lezer-highlighter. -->
<!-- See https://joelgustafson.com/posts/2022-05-31/syntax-highlighting-on-the-web/. -->
<!-- TODO: Write about and/or release Svelte version! -->
<script lang="ts">
  import { fromLezer } from 'hast-util-from-lezer';
  import { components } from '@typematter/svelte-hast';
  import { Unist } from '@typematter/svelte-unist';
  import { parser } from '@lezer/css';

  import { ExpandedDialog } from './ui';
  import { Maximize2Icon } from '@lucide/svelte';

  interface Props {
    source: string;
  }

  const { source, ...rest }: Props = $props();

  const ast = $derived(fromLezer(source, parser.parse(source)));

  let fullscreen = $state(false);
</script>

<div class="preview-wrap">
  <pre>
    <code {...rest}><Unist {ast} {components} /></code>
  </pre>
  <button
    class="btn btn-icon btn-outline expand-btn"
    type="button"
    onclick={() => (fullscreen = true)}
    aria-label="Toggle fullscreen"
  >
    <Maximize2Icon size={14} />
  </button>
</div>

<ExpandedDialog bind:open={fullscreen} title="Source">
  <pre><code><Unist {ast} {components} /></code></pre>
</ExpandedDialog>

<style>
  .preview-wrap {
    position: relative;
  }

  .expand-btn {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    opacity: 0.6;

    &:hover {
      opacity: 1;
    }
  }

  pre {
    display: flex;
    overflow: auto;
    background: var(--bg-subtle);
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    padding: var(--space-4);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: 1.6;

    max-height: 14rem;
    overflow-y: auto;

    code {
      flex-grow: 1;
      width: 0;

      :global {
        .tok-link {
          text-decoration: underline;
        }
        .tok-heading {
          text-decoration: underline;
          font-weight: bold;
        }
        .tok-emphasis {
          font-style: italic;
        }
        .tok-strong {
          font-weight: bold;
        }
        .tok-strikethrough {
          text-decoration: line-through;
        }

        .tok-keyword {
          color: var(--lavender-vivid);
        }
        .tok-atom,
        .tok-url,
        .tok-labelName {
          color: var(--sky-vivid);
        }
        .tok-bool,
        .tok-literal {
          color: var(--peach-vivid);
        }
        .tok-inserted {
          color: var(--mint-vivid);
        }
        .tok-string,
        .tok-deleted {
          color: var(--rose-vivid);
        }
        .tok-string2 {
          color: var(--mint-vivid);
        }
        .tok-variableName.tok-definition {
          color: var(--sky-vivid);
        }
        .tok-variableName.tok-local {
          color: var(--foreground);
        }
        .tok-variableName2,
        .tok-macroName {
          color: var(--sky-vivid);
        }
        .tok-typeName,
        .tok-namespace {
          color: var(--butter-vivid);
        }
        .tok-className {
          color: var(--sky-vivid);
        }
        .tok-propertyName.tok-definition {
          color: var(--lavender-vivid);
        }
        .tok-comment {
          color: var(--fg-muted);
          font-style: italic;
        }
        .tok-meta {
          color: var(--fg-muted);
        }
        .tok-invalid {
          color: var(--danger);
        }
      }
    }
  }

  :global(.dialog-body) pre {
    max-height: none;
  }
</style>
