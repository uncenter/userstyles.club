<script lang="ts">
  import { resolve } from '$app/paths';

  import { BackLink, Alert } from '$components/ui';
  import { Meta, LoginForm } from '$components';

  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<Meta title="Login" description="Sign in to userstyles.club." />

<div class="centered-col">
  <section class="card login-card">
    <div class="login-card__header">
      <h1 class="login-card__title">Sign In</h1>
      <p class="text-muted">Enter your Bluesky (Atmosphere) handle or DID to continue.</p>
    </div>

    {#if data.error}
      <Alert variant="error">{data.error}</Alert>
    {/if}
    <LoginForm />

    <BackLink href={resolve('/')} label="Back to Home" />
  </section>
</div>

<style>
  .login-card {
    .login-card__title {
      font-size: var(--text-2xl);
    }

    .login-card__header {
      display: grid;
      gap: var(--space-1);
      margin-bottom: var(--space-5);
    }
  }
</style>
