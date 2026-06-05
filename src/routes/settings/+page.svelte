<script lang="ts">
  import { appearance } from '$lib/appearance.svelte';

  const appearances = [
    { value: 'system', label: 'System' },
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' }
  ];
</script>

<div class="narrow-col">
  <div class="page-section">
    <h1>Settings</h1>
  </div>

  <div class="page-section">
    <div class="settings-row">
      <div class="settings-label">
        <label for="appearance-select">Appearance</label>
        <p class="text-muted">Choose your preferred color scheme.</p>
      </div>
      <select
        id="appearance-select"
        bind:value={appearance.current}
        style="width: auto; min-width: 9rem;"
      >
        {#each appearances as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>
  </div>
</div>

<style>
  .settings-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-6);

    .settings-label {
      display: grid;
      gap: var(--space-1);

      label {
        margin: 0;
        font-size: var(--text-base);
      }
      p {
        font-size: var(--text-sm);
      }
    }
  }
</style>
