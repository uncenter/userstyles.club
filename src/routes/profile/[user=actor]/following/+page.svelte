<script lang="ts">
  import type { PageProps } from './$types';
  import FollowList from '../FollowList.svelte';

  let { data }: PageProps = $props();
</script>

<FollowList profile={data.profile} kind="following" initial={data.initial} />
