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
    <div class="settings-list__label">
      <label for="appearance-select" class="settings-list__label-text">Appearance</label>
      <p class="settings-list__label-desc text-muted">Choose your preferred color scheme.</p>
    </div>
    <select
      id="appearance-select"
      bind:value={() => preferences.get('appearance'), (val) => preferences.set('appearance', val)}
      class="appearance-select"
    >
      {#each appearances as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
  </div>
  <div class="settings-list__row">
    <div class="settings-list__label">
      <label for="use-permanent-urls-toggle" class="settings-list__label-text"
        >Use Permanent URLs</label
      >
      <p class="settings-list__label-desc text-muted">
        Prefer permanent URLs over shorter URLs by using DIDs instead of handles.
      </p>
    </div>
    <input
      type="checkbox"
      id="use-permanent-urls-toggle"
      bind:checked={
        () => preferences.get('usePermanentUrls'), (val) => preferences.set('usePermanentUrls', val)
      }
      class="use-permanent-urls-toggle"
    />
  </div>
</div>

<details class="card settings-section--collapsed">
  <summary class="settings-section-heading">
    <h2>Network</h2>
    <ChevronDownIcon size={20} class="settings-section-heading__chevron" aria-hidden="true" />
  </summary>
  <div class="settings-list">
    <div class="settings-list__row">
      <div class="settings-list__label">
        <label for="appview-enabled-toggle" class="settings-list__label-text">Use Appview</label>
        <p class="settings-list__label-warning">
          Note: The appview is required for optimal performance.
        </p>
        <p class="settings-list__label-desc text-muted">
          When enabled, network requests are directed to the internal Crayon appview instance. When disabled, the Constellation and Slingshot community instances are relied on entirely for all request functionality, skipping the appview entirely.
        </p>
      </div>
      <input
        type="checkbox"
        id="appview-enabled-toggle"
        bind:checked={
          () => preferences.get('isAppviewEnabled'), (val) => preferences.set('isAppviewEnabled', val)
        }
        class="appview-enabled-toggle"
      />
    </div>
    <div class="settings-list__row">
      <div class="settings-list__label">
        <label for="appview-url-input" class="settings-list__label-text">Appview URL</label>
        <p class="settings-list__label-desc text-muted">The Crayon instance to interact with.</p>
      </div>
      <input
        type="text"
        id="appview-url-input"
        inputmode="url"
        placeholder="https://crayon.userstyles.club"
        disabled={!preferences.get('isAppviewEnabled')}
        class="settings-url-input"
        bind:value={
          () => preferences.get('customAppviewUrl'), (val) => preferences.set('customAppviewUrl', val.trim())
        }
      />
    </div>
    <div class="settings-list__row">
      <div class="settings-list__label">
        <label for="constellation-url-input" class="settings-list__label-text"
          >Constellation URL</label
        >
        <p class="settings-list__label-desc text-muted">
          Used to look up comments and ratings (backlinks) when the appview is off or unreachable.
        </p>
      </div>
      <input
        type="text"
        id="constellation-url-input"
        inputmode="url"
        placeholder="https://constellation.microcosm.blue"
        class="settings-url-input"
        bind:value={
          () => preferences.get('customConstellationUrl'),
          (val) => preferences.set('customConstellationUrl', val.trim())
        }
      />
    </div>
    <div class="settings-list__row">
      <div class="settings-list__label">
        <label for="slingshot-url-input" class="settings-list__label-text">Slingshot URL</label>
        <p class="settings-list__label-desc text-muted">Used to resolve identities and PDSes, regardless of appview preferences.</p>
      </div>
      <input
        type="text"
        id="slingshot-url-input"
        inputmode="url"
        placeholder="https://slingshot.microcosm.blue"
        class="settings-url-input"
        bind:value={
          () => preferences.get('customSlingshotUrl'), (val) => preferences.set('customSlingshotUrl', val.trim())
        }
      />
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
    align-items: center;
    justify-content: space-between;
    gap: var(--space-6);

    .settings-list__label {
      display: grid;
      gap: var(--space-1);

      .settings-list__label-text {
        margin: 0;
        font-size: var(--text-base);
        font-weight: 600;
      }
      .settings-list__label-desc {
        font-size: var(--text-sm);
      }
      .settings-list__label-warning {
        font-size: var(--text-sm);
        color: var(--warning);
      }
    }

    .settings-url-input {
      width: 100%;
      max-width: 22rem;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  .appearance-select {
    width: auto;
    min-width: 9rem;
  }
</style>
