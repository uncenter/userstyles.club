<!-- Component adapted from https://github.com/joeltg/react-lezer-highlighter. -->
<!-- See https://joelgustafson.com/posts/2022-05-31/syntax-highlighting-on-the-web/. -->
<!-- TODO: Write about and/or release Svelte version! -->
<script lang="ts">
import { fromLezer } from "hast-util-from-lezer";
import { components } from '@typematter/svelte-hast';
import { Unist } from '@typematter/svelte-unist';
import { parser } from "@lezer/css";

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

    code {
      flex-grow: 1;
      width: 0;
    }
  }

  /* Styles from https://github.com/joeltg/react-lezer-highlighter/blob/1a61b1b8a2bb226d328308d7303d5d5c911a72cd/styles/default.css. */
  :global {
    .tok-link {
      text-decoration: underline;
    }

    .tok-heading {
      text-decoration: underline;
      font-weight: bold;
    }

    .tok-emphasis {
      font-size: italic;
    }

    .tok-strong {
      font-weight: bold;
    }

    .tok-strikethrough {
      text-decoration: line-through;
    }

    .tok-keyword {
      color: #708;
    }

    .tok-atom,
    .tok-bool,
    .tok-url,
    .tok-labelName {
      color: #219;
    }

    .tok-literal,
    .tok-inserted {
      color: #164;
    }

    .tok-string,
    .tok-deleted {
      color: #a11;
    }

    .tok-string2 {
      color: #e40;
    }

    .tok-variableName.tok-definition {
      color: #00f;
    }

    .tok-variableName.tok-local {
      color: #30a;
    }

    .tok-variableName2,
    .tok-macroName {
      color: #256;
    }

    .tok-typeName,
    .tok-namespace {
      color: #085;
    }

    .tok-className {
      color: #167;
    }

    .tok-propertyName.tok-definition {
      color: #00c;
    }

    .tok-comment {
      color: #940;
    }

    .tok-meta {
      color: #7a757a;
    }

    .tok-invalid {
      color: #f00;
    }
  }
</style>
