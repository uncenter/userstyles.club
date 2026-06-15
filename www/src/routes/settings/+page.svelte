<script lang="ts">
  import { preferences } from '$lib/preferences.svelte';
  import { joinPageTitle } from '$lib/constants';

  const appearances = [
    { value: 'system', label: 'System' },
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
  ];
</script>

<svelte:head>
  <title>{joinPageTitle('Settings')}</title>
</svelte:head>

<div class="page-section">
  <h1>Settings</h1>
</div>

<div class="page-section settings-list">
  <div class="settings-row">
    <div class="settings-label">
      <label for="appearance-select">Appearance</label>
      <p class="text-muted">Choose your preferred color scheme.</p>
    </div>
    <select
      id="appearance-select"
      bind:value={
        () => preferences.get('appearance'), (val) => preferences.set('appearance', val)
      }
      class="appearance-select"
    >
      {#each appearances as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
  </div>
  <div class="settings-row">
    <div class="settings-label">
      <label for="use-permanent-urls-toggle">Use Permanent URLs</label>
      <p class="text-muted">
        Prefer permanent URLs over shorter URLs by using DIDs instead of handles.
      </p>
    </div>
    <input
      type="checkbox"
      id="use-permanent-urls-toggle"
      bind:checked={
        () => preferences.get('usePermanentUrls'),
        (val) => preferences.set('usePermanentUrls', val)
      }
      class="use-permanent-urls-toggle"
    />
  </div>
</div>

<style>
  .settings-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

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

  .appearance-select {
    width: auto;
    min-width: 9rem;
  }
</style>
