<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';

  import { ArrowLeftIcon } from '@lucide/svelte';
  import { Meta } from '$components';
</script>

<Meta title={String(page.status)} description={page.error?.message ?? 'Something went wrong.'} />

<div class="centered-col">
  <section class="card error-page">
    <p class="error-page__status">{page.status}</p>
    <h3>{page.error?.message ?? 'Something went wrong'}</h3>
    <a href={resolve('/')} class="btn btn--outline"><ArrowLeftIcon size={14} /> Go Back</a>
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
