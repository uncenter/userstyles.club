<script lang="ts">
  import { page } from '$app/state';
  import { TAGLINE, joinPageTitle } from '$lib/constants';

  interface Props {
    title?: string | string[];
    description?: string;
    image?: string;
    imageAlt?: string;
    imageSize?: 'small' | 'large';
    type?: 'website' | 'profile';
  }

  let {
    title = [],
    description = TAGLINE,
    image,
    imageAlt,
    imageSize = 'large',
    type = 'website',
  }: Props = $props();

  let fullTitle = $derived(joinPageTitle(...(Array.isArray(title) ? title : [title])));
  let url = $derived(page.url.href);
</script>

<svelte:head>
  <title>{fullTitle}</title>
  <meta name="description" content={description} />

  <meta property="og:type" content={type} />
  <meta property="og:site_name" content="userstyles.club" />
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={url} />
  {#if image}
    <meta property="og:image" content={image} />
    {#if imageAlt}
      <meta property="og:image:alt" content={imageAlt} />
    {/if}
  {/if}

  <meta name="twitter:card" content={image && imageSize === 'large' ? 'summary_large_image' : 'summary'} />
  <meta name="twitter:title" content={fullTitle} />
  <meta name="twitter:description" content={description} />
  {#if image}
    <meta name="twitter:image" content={image} />
  {/if}
</svelte:head>
