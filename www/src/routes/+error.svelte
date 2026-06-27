<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
</script>

<div class="centered-col">
  <section class="page-section error-page">
    <p class="error-page__status">{page.status}</p>
    <h3>{page.error?.message ?? 'Something went wrong'}</h3>
    <a href={resolve('/')} class="btn btn--outline">← Back home</a>
  </section>
</div>

<style>
  .error-page {
    margin-top: var(--space-6);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);

    .error-page__status {
      font-family: var(--font-display);
      font-size: var(--text-4xl);
      font-weight: 700;
      color: var(--danger);
      line-height: 1;
    }
  }
</style>
