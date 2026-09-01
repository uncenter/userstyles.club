<script lang="ts">
  import { ChevronDownIcon } from '@lucide/svelte';

  import { preferences } from '$lib/preferences.svelte';
  import { Meta } from '$components';

  const appearances = [
    { value: 'system', label: 'System' },
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
  ];
</script>

<Meta title="Settings" description="Manage your userstyles.club local preferences." />

<div class="card">
  <h1>Settings</h1>
</div>

<div class="card settings-list">
  <div class="settings-list__row">
    <label for="appearance-select" class="settings-list__label">Appearance</label>
    <select
      id="appearance-select"
      bind:value={() => preferences.get('appearance'), (val) => preferences.set('appearance', val)}
      class="settings-list__input settings-list__input--select"
    >
      {#each appearances as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
    <p class="settings-list__desc text-muted">Choose your preferred color scheme.</p>
  </div>
  <div class="settings-list__row">
    <label for="use-permanent-urls-toggle" class="settings-list__label">Use Permanent URLs</label>
    <input
      type="checkbox"
      {...{ switch: true }}
      id="use-permanent-urls-toggle"
      bind:checked={
        () => preferences.get('usePermanentUrls'), (val) => preferences.set('usePermanentUrls', val)
      }
      class="use-permanent-urls-toggle"
    />
    <p class="settings-list__desc text-muted">
      Prefer permanent DID-based URLs instead of shorter, handle-based URLs.<br>
      (Permanent URLs are always used for style install URLs, regardless of preference.)
    </p>
  </div>
</div>

<details class="card settings-section--collapsed">
  <summary class="settings-section-heading">
    <h2>Network</h2>
    <ChevronDownIcon size={20} class="settings-section-heading__chevron" aria-hidden="true" />
  </summary>
  <div class="settings-list">
    <div class="settings-list__row">
      <label for="appview-enabled-toggle" class="settings-list__label">Use Appview</label>
      <input
        type="checkbox"
        {...{ switch: true }}
        id="appview-enabled-toggle"
        bind:checked={
          () => preferences.get('isAppviewEnabled'),
          (val) => preferences.set('isAppviewEnabled', val)
        }
        class="appview-enabled-toggle"
      />
      <p class="settings-list__desc text-muted">
        <span class="settings-list__desc-warning">
          Note: The appview is required for some features and recommended for usable performance.
        </span>
        When enabled, network requests for fetching userstyles-related data are directed to the configured Crayon appview instance.
        When disabled, requests are directed to the configured Constellation and Slingshot instances (this may be helpful if the appview is slow or offline).
      </p>
    </div>
    <div class="settings-list__row">
      <label for="appview-url-input" class="settings-list__label">Appview URL</label>
      <input
        type="text"
        id="appview-url-input"
        inputmode="url"
        placeholder="https://crayon.userstyles.club"
        disabled={!preferences.get('isAppviewEnabled')}
        class="settings-list__input settings-list__input--url"
        bind:value={
          () => preferences.get('customAppviewUrl'),
          (val) => preferences.set('customAppviewUrl', val.trim())
        }
      />
      <p class="settings-list__desc text-muted">The Crayon-compatible appview instance to interact with.</p>
    </div>
    <div class="settings-list__row">
      <label for="constellation-url-input" class="settings-list__label">Constellation URL</label>
      <input
        type="text"
        id="constellation-url-input"
        inputmode="url"
        placeholder="https://constellation.microcosm.blue"
        class="settings-list__input settings-list__input--url"
        bind:value={
          () => preferences.get('customConstellationUrl'),
          (val) => preferences.set('customConstellationUrl', val.trim())
        }
      />
      <p class="settings-list__desc text-muted">
        The <a href="https://constellation.microcosm.blue/">Constellation</a> backlink index instance. Used to look up comments and ratings (backlinks) when the appview is off or unreachable.
      </p>
    </div>
    <div class="settings-list__row">
      <label for="slingshot-url-input" class="settings-list__label">Slingshot URL</label>
      <input
        type="text"
        id="slingshot-url-input"
        inputmode="url"
        placeholder="https://slingshot.microcosm.blue"
        class="settings-list__input settings-list__input--url"
        bind:value={
          () => preferences.get('customSlingshotUrl'),
          (val) => preferences.set('customSlingshotUrl', val.trim())
        }
      />
      <p class="settings-list__desc text-muted">
        The <a href="https://slingshot.microcosm.blue/">Slingshot</a> edge record and identity cache instance. Used to resolve identities and PDSes, regardless of appview preferences.
      </p>
    </div>
  </div>
</details>

<style>
  .settings-section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--text-lg);
    margin-bottom: var(--space-4);
    cursor: pointer;
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }

    h2 {
      font-size: var(--text-lg);
      font-weight: 700;
    }

    :global(.settings-section-heading__chevron) {
      flex-shrink: 0;
      transition: transform 0.15s ease;
    }
  }

  .settings-section--collapsed {
    &:not([open]) .settings-section-heading {
      margin-bottom: 0;
    }

    &[open] .settings-section-heading :global(.settings-section-heading__chevron) {
      transform: rotate(180deg);
    }
  }

  .settings-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .settings-list__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);

    .settings-list__label {
      margin: 0;
      font-size: var(--text-base);
      font-weight: 600;
    }

    .settings-list__desc {
      flex-basis: 100%;
      font-size: var(--text-base);

      .settings-list__desc-warning {
        display: block;
        margin-bottom: var(--space-1);
        font-size: var(--text-sm);
        color: var(--warning);
      }
    }

    .settings-list__input {
      margin-inline-start: auto;

      &.settings-list__input--url {
        width: 100%;
        max-width: 22rem;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      &.settings-list__input--select {
        width: auto;
      }
    }
  }
</style>
