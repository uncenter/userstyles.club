<script lang="ts">
  import { PersistedState } from "runed";

  let appearance = new PersistedState("appearance", "system");
  let appearances = [
    {
      value: 'system',
      label: 'System'
    },
    {
      value: 'dark',
      label: 'Dark'
    },
    {
      value: 'light',
      label: 'Light'
    }
  ];
</script>

<header class="panel">
  <h1 class="section-title">Settings</h1>
</header>

<section class="panel">
  Appearance
	<select
    name="appearance"
		bind:value={appearance.current}
	>
		{#each appearances as opt}
			<option value={opt.value}>
				{opt.label}
			</option>
		{/each}
	</select>
</section>

