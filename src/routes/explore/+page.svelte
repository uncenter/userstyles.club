<script lang="ts">
  import type { PageProps } from './$types';

  import { Meta, UserstyleBrowser } from '$components';

  let { data }: PageProps = $props();
</script>

<Meta
  title="Explore"
  description="Discover userstyles shared on userstyles.club."
/>

<div class="page-section">
  <h1>Explore</h1>
</div>
<UserstyleBrowser initial={data.initial} />
