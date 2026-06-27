<script lang="ts">
  import { resolve } from '$app/paths';

  import { TAGLINE } from '$lib/constants';

  import { Wordmark, Logomark } from '$components/branding';
</script>

<div class="welcome">
  <div class="welcome__mark">
    <Logomark size="8rem" />
  </div>
  <div class="welcome__text">
    <Wordmark --height="clamp(2rem, 8vw, 4rem)" />
    <p class="welcome__tagline">{TAGLINE}</p>
  </div>
  <div class="welcome__actions">
    <a href={resolve('/login')} class="btn btn--primary btn--lg">Get started</a>
    <a href={resolve('/explore')} class="btn btn--outline btn--lg">Explore styles</a>
  </div>
</div>

<style>
  .welcome {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-8);
    padding: var(--space-12) var(--space-8);
    text-align: center;
    background: var(--card-bg);
    border-radius: var(--radius);

    @media (max-width: 639px) {
      padding: var(--space-8) var(--space-4);
      gap: var(--space-6);
    }

    .welcome__text {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
    }

    .welcome__tagline {
      font-size: var(--text-lg);
      color: var(--fg-muted);
      max-width: 32rem;
      margin-inline: auto;
      line-height: 1.6;
    }

    .welcome__actions {
      display: flex;
      gap: var(--space-3);
      justify-content: center;
      flex-wrap: wrap;
    }
  }
</style>
