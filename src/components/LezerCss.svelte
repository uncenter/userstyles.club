<!-- Component adapted from https://github.com/joeltg/react-lezer-highlighter. -->
<!-- See https://joelgustafson.com/posts/2022-05-31/syntax-highlighting-on-the-web/. -->
<!-- TODO: Write about and/or release Svelte version! -->
<script lang="ts">
  import { fromLezer } from 'hast-util-from-lezer';
  import { components } from '@typematter/svelte-hast';
  import { Unist } from '@typematter/svelte-unist';
  import { parser } from '@lezer/css';

  interface Props {
    source: string;
  }

  const { source, ...rest }: Props = $props();

  const ast = $derived(fromLezer(source, parser.parse(source)));
</script>

<pre>
  <code {...rest}><Unist {ast} {components} /></code>
</pre>

<style>
  pre {
    display: flex;
    overflow: auto;
    background: var(--bg-subtle);
    border: 2px solid var(--foreground);
    border-left: 5px solid var(--accent);
    padding: var(--space-4);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: 1.6;

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
        .tok-bool,
        .tok-url,
        .tok-labelName {
          color: var(--sky-vivid);
        }
        .tok-literal,
        .tok-inserted {
          color: var(--mint-vivid);
        }
        .tok-string,
        .tok-deleted {
          color: var(--rose-vivid);
        }
        .tok-string2 {
          color: var(--peach-vivid);
        }
        .tok-variableName.tok-definition {
          color: var(--sky-vivid);
        }
        .tok-variableName.tok-local {
          color: var(--lavender-vivid);
        }
        .tok-variableName2,
        .tok-macroName {
          color: var(--sky-vivid);
        }
        .tok-typeName,
        .tok-namespace {
          color: var(--mint-vivid);
        }
        .tok-className {
          color: var(--sky-vivid);
        }
        .tok-propertyName.tok-definition {
          color: var(--butter-vivid);
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
</style>
