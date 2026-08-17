<script lang="ts">
  import { untrack } from 'svelte';
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';

  import { login, signup, user, searchActorsTypeahead, type TypeaheadActor } from '$lib/at';

  import { BackLink, Loading, Alert, Avatar, Spinner } from '$components/ui';
  import { Meta } from '$components';

  import { isActorIdentifier, isDid } from '@atcute/lexicons/syntax';

  let handle = $state('');
  let error = $state<string | null>(null);
  let loading = $state(false);

  let suggestions = $state({
    items: [] as TypeaheadActor[],
    loading: false,
    open: false,
    idx: -1,
    focused: false,
    skipNextQuery: false,
  });

  $effect(() => {
    if (user.isLoggedIn) {
      goto('/');
    }
  });

  $effect(() => {
    const query = handle.trim();

    if (untrack(() => suggestions.skipNextQuery)) {
      suggestions.skipNextQuery = false;
      return;
    }

    if (!query || isDid(query)) {
      suggestions.items = [];
      suggestions.loading = false;
      suggestions.open = false;
      return;
    }

    const controller = new AbortController();
    suggestions.loading = true;
    const timer = setTimeout(() => {
      searchActorsTypeahead(query, { signal: controller.signal })
        .then((actors) => {
          suggestions.items = actors;
          suggestions.idx = -1;
          suggestions.open = suggestions.focused && actors.length > 0;
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          suggestions.items = [];
          suggestions.open = false;
        })
        .finally(() => {
          if (!controller.signal.aborted) suggestions.loading = false;
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  });

  function selectSuggestion(actor: TypeaheadActor) {
    suggestions.skipNextQuery = true;
    handle = actor.handle;
    suggestions.items = [];
    suggestions.open = false;
    suggestions.idx = -1;
  }

  function onInputKeydown(event: KeyboardEvent) {
    if (!suggestions.open || suggestions.items.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      suggestions.idx = (suggestions.idx + 1) % suggestions.items.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      suggestions.idx = (suggestions.idx - 1 + suggestions.items.length) % suggestions.items.length;
    } else if (event.key === 'Enter' && suggestions.idx >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions.items[suggestions.idx]);
    } else if (event.key === 'Escape') {
      suggestions.open = false;
      suggestions.idx = -1;
    }
  }

  async function submit(event: Event) {
    event.preventDefault();
    if (!handle.trim()) {
      error = 'Enter your handle or DID.';
      return;
    }

    suggestions.open = false;
    loading = true;
    error = null;
    try {
      await login(handle);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Login failed.';
      loading = false;
    }
  }
</script>

<Meta title="Login" description="Sign in to userstyles.club." />

<div class="centered-col">
  <section class="page-section login-card">
    <div class="login-card__header">
      <h1 class="login-card__title">Sign In</h1>
      <p class="text-muted">Enter your Bluesky (Atmosphere) handle or DID to continue.</p>
    </div>

    <form onsubmit={submit} class="form-stack">
      <div class="form-group combobox">
        <label for="handle-input">Handle or DID</label>
        <div class="combobox__input-wrap">
          <input
            id="handle-input"
            type="text"
            bind:value={handle}
            placeholder="alice.bsky.social"
            autocomplete="off"
            autocapitalize="none"
            spellcheck="false"
            role="combobox"
            aria-expanded={suggestions.open}
            aria-controls="handle-suggestions"
            aria-autocomplete="list"
            aria-activedescendant={suggestions.idx >= 0
              ? `handle-suggestion-${suggestions.idx}`
              : undefined}
            onfocus={() => {
              suggestions.focused = true;
              if (suggestions.items.length > 0) suggestions.open = true;
            }}
            onblur={() => {
              suggestions.focused = false;
              suggestions.open = false;
            }}
            onkeydown={onInputKeydown}
          />
          {#if suggestions.loading}
            <Spinner size="sm" />
          {/if}
        </div>
        {#if suggestions.open && suggestions.items.length > 0}
          <ul class="combobox__suggestions" id="handle-suggestions" role="listbox">
            {#each suggestions.items as actor, i (actor.did)}
              <li role="presentation">
                <button
                  type="button"
                  id={`handle-suggestion-${i}`}
                  role="option"
                  aria-selected={i === suggestions.idx}
                  class="combobox__suggestion"
                  class:combobox__suggestion--active={i === suggestions.idx}
                  onmousedown={(event) => event.preventDefault()}
                  onclick={() => selectSuggestion(actor)}
                >
                  <span aria-hidden="true">
                    <Avatar src={actor.avatar} name={actor.displayName || actor.handle} size="sm" />
                  </span>
                  <span class="combobox__suggestion-text">
                    <span class="combobox__suggestion-name truncate-1">
                      {actor.displayName || `@${actor.handle}`}
                    </span>
                    {#if actor.displayName}
                      <span class="combobox__suggestion-handle truncate-1">@{actor.handle}</span>
                    {/if}
                  </span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
      {#if error}
        <Alert variant="error">{error}</Alert>
      {/if}
      <button
        type="submit"
        class="btn btn--primary"
        disabled={loading || !isActorIdentifier(handle)}
      >
        <Loading pending={loading} idle="Continue" active="Signing in…" />
      </button>
      <button type="button" class="link" onclick={signup}>
        Don't have a Bluesky (Atmosphere) account?
      </button>
    </form>

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

  .combobox {
    position: relative;

    .combobox__input-wrap {
      position: relative;
      display: flex;
      align-items: center;

      input {
        padding-right: var(--space-8);
      }

      :global(.spinner) {
        position: absolute;
        right: var(--space-3);
        color: var(--fg-muted);
      }
    }

    .combobox__suggestions {
      position: absolute;
      top: calc(100% + var(--space-1));
      left: 0;
      right: 0;
      z-index: 10;
      display: grid;
      gap: var(--space-1);
      margin: 0;
      padding: var(--space-1);
      list-style: none;
      max-height: 16rem;
      overflow-y: auto;
      background: var(--float-bg);
      border: 2px solid var(--input-border);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-sm);
    }

    .combobox__suggestion {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      width: 100%;
      padding: var(--space-2);
      background: none;
      border: none;
      border-radius: var(--radius-sm);
      font: inherit;
      text-align: left;
      color: var(--foreground);
      cursor: pointer;

      &:hover,
      &.combobox__suggestion--active {
        background: var(--bg-muted);
      }

      .combobox__suggestion-text {
        display: grid;
        min-width: 0;
      }

      .combobox__suggestion-name {
        font-weight: 700;
        font-family: var(--font-display);
      }

      .combobox__suggestion-handle {
        font-size: var(--text-sm);
        color: var(--fg-muted);
      }
    }
  }
</style>
