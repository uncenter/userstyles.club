<!-- Component adapted from https://github.com/joeltg/react-lezer-highlighter. -->
<!-- See https://joelgustafson.com/posts/2022-05-31/syntax-highlighting-on-the-web/. -->
<!-- TODO: Write about and/or release Svelte version! -->
<script lang="ts">
  import { fromLezer } from 'hast-util-from-lezer';
  import { toHtml } from 'hast-util-to-html';
  import { parser } from '@lezer/css';

  import { ExpandedDialog } from './ui';
  import { Maximize2Icon } from '@lucide/svelte';

  interface Props {
    source: string;
  }

  const { source, ...rest }: Props = $props();

  const html = $derived(toHtml(fromLezer(source, parser.parse(source))));

  let fullscreen = $state(false);
</script>

<div class="preview-wrap">
  <pre class="preview-wrap__source-wrap">
    <code class="preview-wrap__code" {...rest}>{@html html}</code>
  </pre>
  <button
    class="btn btn--icon btn--outline preview-wrap__expand-btn"
    type="button"
    onclick={() => (fullscreen = true)}
    aria-label="Toggle fullscreen"
  >
    <Maximize2Icon size={14} />
  </button>
</div>

<ExpandedDialog bind:open={fullscreen} title="Source">
  <pre class="preview-wrap__source-wrap"><code class="preview-wrap__code">{@html html}</code></pre>
</ExpandedDialog>

<style>
  @import '@catppuccin/palette/css/catppuccin.css';

  .preview-wrap {
    position: relative;

    .preview-wrap__expand-btn {
      position: absolute;
      top: var(--space-2);
      right: var(--space-2);
      opacity: 0.6;

      &:hover {
        opacity: 1;
      }
    }
  }

  .preview-wrap__source-wrap {
    display: flex;
    overflow: auto;
    background: var(--bg-subtle);
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    padding: var(--space-4);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: 1.6;

    max-height: 24rem;
    overflow-y: auto;

    .preview-wrap__code {
      flex-grow: 1;
      width: 0;
      color: var(--ctp-text);

      --ctp-rosewater: light-dark(var(--ctp-latte-rosewater), var(--ctp-mocha-rosewater));
      --ctp-flamingo: light-dark(var(--ctp-latte-flamingo), var(--ctp-mocha-flamingo));
      --ctp-pink: light-dark(var(--ctp-latte-pink), var(--ctp-mocha-pink));
      --ctp-mauve: light-dark(var(--ctp-latte-mauve), var(--ctp-mocha-mauve));
      --ctp-red: light-dark(var(--ctp-latte-red), var(--ctp-mocha-red));
      --ctp-maroon: light-dark(var(--ctp-latte-maroon), var(--ctp-mocha-maroon));
      --ctp-peach: light-dark(var(--ctp-latte-peach), var(--ctp-mocha-peach));
      --ctp-yellow: light-dark(var(--ctp-latte-yellow), var(--ctp-mocha-yellow));
      --ctp-green: light-dark(var(--ctp-latte-green), var(--ctp-mocha-green));
      --ctp-teal: light-dark(var(--ctp-latte-teal), var(--ctp-mocha-teal));
      --ctp-sky: light-dark(var(--ctp-latte-sky), var(--ctp-mocha-sky));
      --ctp-sapphire: light-dark(var(--ctp-latte-sapphire), var(--ctp-mocha-sapphire));
      --ctp-blue: light-dark(var(--ctp-latte-blue), var(--ctp-mocha-blue));
      --ctp-lavender: light-dark(var(--ctp-latte-lavender), var(--ctp-mocha-lavender));
      --ctp-overlay2: light-dark(var(--ctp-latte-overlay2), var(--ctp-mocha-overlay2));
      --ctp-text: light-dark(var(--ctp-latte-text), var(--ctp-mocha-text));

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
          color: var(--ctp-mauve);
        }
        .tok-atom {
          color: var(--ctp-red);
        }
        .tok-url,
        .tok-labelName {
          color: var(--ctp-blue);
        }
        .tok-bool,
        .tok-literal {
          color: var(--ctp-peach);
        }
        .tok-string,
        .tok-string2 {
          color: var(--ctp-green);
        }
        .tok-deleted {
          color: var(--ctp-red);
        }
        .tok-inserted {
          color: var(--ctp-green);
        }
        .tok-variableName.tok-definition {
          color: var(--ctp-blue);
        }
        .tok-variableName.tok-local {
          color: var(--ctp-text);
        }
        .tok-variableName2,
        .tok-macroName {
          color: var(--ctp-blue);
        }
        .tok-typeName,
        .tok-namespace {
          color: var(--ctp-yellow);
        }
        .tok-className {
          color: var(--ctp-blue);
        }
        .tok-propertyName.tok-definition {
          color: var(--ctp-lavender);
        }
        .tok-comment {
          color: var(--ctp-overlay2);
          font-style: italic;
        }
        .tok-meta {
          color: var(--ctp-overlay2);
        }
        .tok-invalid {
          color: var(--danger);
        }
      }
    }
  }

  :global(.dialog__body) .preview-wrap__source-wrap {
    max-height: none;
  }
</style>
