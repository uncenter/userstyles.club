<script lang="ts">
  import { joinPageTitle } from '$lib/constants';

  import { UserstyleBrowser } from '$components';
</script>

<svelte:head>
  <title>{joinPageTitle('Explore')}</title>
</svelte:head>

<div class="page-section">
  <h1>Explore</h1>
</div>
<UserstyleBrowser />
