<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import '../app.css';

  import { initClient, user, logout } from '$lib/at';
  import { appearance } from '$lib/appearance.svelte';
  import { TAGLINE, REPO_URL } from '$lib/constants';
  import { Spinner, Avatar, Logo } from '$components';

  let { children } = $props();

  $effect(() => {
    const val = appearance.current;
    const html = document.documentElement;
    if (val === 'dark') {
      html.setAttribute('data-theme', 'dark');
    } else if (val === 'light') {
      html.setAttribute('data-theme', 'light');
    } else {
      html.removeAttribute('data-theme');
    }
  });

  let menuPopover: HTMLElement | undefined = $state();
  $effect(() => {
    if (menuPopover) {
      // Close popover if one of the popover menu items is clicked.
      menuPopover.addEventListener('click', () => {
        if (menuPopover!.matches(':popover-open')) {
          menuPopover!.hidePopover();
        }
      });
    }
  });

  onMount(async () => {
    await initClient();
  });
</script>

<svelte:head>
  <title>userstyles.club</title>
  <meta name="description" content={TAGLINE} />
  <link rel="icon" href="/favicon.svg" />
</svelte:head>

{#if user.isInitializing}
  <div class="init-screen">
    <Spinner size="lg" />
  </div>
{:else}
  <nav class="navbar">
    <div class="navbar-inner">
      <a href={resolve('/')} class="navbar-logo"><Logo /></a>
      <ul class="navbar-links" role="list">
        <li><a href={resolve('/')}>Home</a></li>
        <li><a href={resolve('/explore')}>Explore</a></li>
        <li><a href={resolve('/new')} class="btn btn-primary">New</a></li>
        {#if user.isLoggedIn && user.did}
          <li class="user-menu">
            <button
              class="user-menu-trigger"
              popovertarget="user-menu-popover"
              popovertargetaction="toggle"
              aria-haspopup="menu"
              aria-label="User menu"
            >
              <Avatar
                src={user.profile?.avatar}
                name={user.profile?.displayName ?? user.profile?.handle ?? ''}
                alt={user.profile?.handle ?? 'profile'}
                size="md"
              />
            </button>
            <div
              id="user-menu-popover"
              bind:this={menuPopover}
              popover
              class="dropdown"
              role="menu"
            >
              <a href={resolve('/profile/[user=actor]', { user: user.did })} role="menuitem"
                >Profile</a
              >
              <a href={resolve('/settings')} role="menuitem">Settings</a>
              <button
                type="button"
                role="menuitem"
                class="dropdown-danger"
                onclick={() => {
                  logout();
                }}>Logout</button
              >
            </div>
          </li>
        {:else}
          <li class="nav-login"><a href={resolve('/login')} class="btn">Login</a></li>
        {/if}
      </ul>
    </div>
  </nav>
  <main class="container">
    {@render children()}
  </main>
  <footer class="site-footer">
    <div class="container">
      <div class="footer-brand">
        <a href={resolve('/')} class="footer-logo"><Logo height="1.25rem" /></a>
        <p class="footer-tagline">{TAGLINE}</p>
      </div>
      <a href={REPO_URL} target="_blank" rel="noopener noreferrer" class="footer-source">Source ↗</a
      >
    </div>
  </footer>
{/if}

<style>
  .init-screen {
    min-height: 100vh;
    display: grid;
    place-items: center;
  }

  .site-footer {
    border-top: 2px solid var(--border);
    padding: var(--space-5) 0;

    .container {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-8);
    }

    .footer-brand {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);

      .footer-logo {
        display: flex;
        align-items: center;
        opacity: 0.6;
        transition: opacity var(--ease-fast);
        &:hover {
          opacity: 1;
        }
      }

      .footer-tagline {
        font-size: var(--text-sm);
        color: var(--fg-muted);
        max-width: 28rem;
        line-height: 1.5;
        margin: 0;
      }
    }

    .footer-source {
      flex-shrink: 0;
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--fg-muted);
      text-decoration: none;
      &:hover {
        color: var(--accent);
        text-decoration: underline;
      }
    }
  }

  .nav-login {
    margin-left: var(--space-3);

    a {
      background: var(--sky);
      color: var(--sky-vivid);
      border: 2px solid var(--sky-vivid);
      box-shadow: 3px 3px 0 var(--sky-vivid);
      font-weight: 700;

      &:hover {
        color: var(--sky-vivid);
        background: var(--sky);
        transform: translate(-1px, -1px);
        box-shadow: 4px 4px 0 var(--sky-vivid);
      }
      &:active {
        transform: translate(2px, 2px);
        box-shadow: 1px 1px 0 var(--sky-vivid);
      }
    }
  }
</style>
