<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import type { AppBskyActorDefs } from '@atcute/bluesky';
  import { ActorSearch } from '$components';

  function selectActor(actor: AppBskyActorDefs.ProfileViewBasic) {
    goto(`/profile/${actor.did}`);
  }
</script>

<main class="shell" style="padding: 2rem 0 3rem; display: grid; gap: 1rem;">
  <header class="panel">
    <h1 class="section-title">Search profiles</h1>
  </header>

  <section class="panel">
    <div class="actions">
      <a href="{base}/" class="btn">Home</a>
    </div>
  </section>

  <section class="panel">
    <ActorSearch onSelect={selectActor} />
  </section>

  <section class="panel">
    <p class="muted" style="margin: 0;">Type a handle or display name, then pick an actor.</p>
  </section>
</main>
