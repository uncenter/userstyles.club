<script lang="ts">
  import { goto } from '$app/navigation';
  import type { AppBskyActorDefs } from '@atcute/bluesky';
  import { ActorSearch } from '$components';

  function selectActor(actor: AppBskyActorDefs.ProfileViewBasic) {
    goto(`/profile/${actor.did}`);
  }
</script>

<header class="panel">
  <h1 class="section-title">Settings</h1>
</header>

<section class="panel">
  <!-- <ActorSearch onSelect={selectActor} /> -->
</section>

