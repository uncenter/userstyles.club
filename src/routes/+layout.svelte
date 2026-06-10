<script lang="ts">
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { resolve } from '$app/paths';
  import '../app.css';

  import { initClient, user, logout } from '$lib/at';
  import { appearance } from '$lib/appearance.svelte';
  import { TAGLINE, REPO_URL } from '$lib/constants';

  import { LogoCombo } from '$components/branding';
  import { Spinner, Avatar } from '$components/ui';

  import { MenuIcon, MoveUpRightIcon, XIcon } from '@lucide/svelte';

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

  let userMenuPopover: HTMLElement | undefined = $state();
  let mobileNavPopover: HTMLElement | undefined = $state();

  afterNavigate(() => {
    if (mobileNavPopover?.matches(':popover-open')) {
      mobileNavPopover.hidePopover();
    } else if (userMenuPopover?.matches(':popover-open')) {
      userMenuPopover.hidePopover();
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
      <a href={resolve('/')} class="navbar-logo"><LogoCombo /></a>

      <ul class="navbar-links" role="list">
        <li><a href={resolve('/')} class="nav-link">Home</a></li>
        <li><a href={resolve('/explore')} class="nav-link">Explore</a></li>
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
              bind:this={userMenuPopover}
              popover
              class="user-menu-dropdown"
              role="menu"
            >
              <a href={resolve('/profile/[user=actor]', { user: user.did })} role="menuitem"
                >Profile</a
              >
              <a href={resolve('/settings')} role="menuitem">Settings</a>
              <button
                type="button"
                role="menuitem"
                class="menu-item-danger"
                popovertarget="user-menu-popover" popovertargetaction="hide"
                onclick={() => logout()}>Logout</button
              >
            </div>
          </li>
        {:else}
          <li class="nav-login"><a href={resolve('/login')} class="btn btn-outline">Login</a></li>
        {/if}
      </ul>

      <button
        class="nav-toggle"
        popovertarget="mobile-nav-popover"
        popovertargetaction="toggle"
        aria-haspopup="menu"
        aria-label="Navigation menu"
      >
        <MenuIcon size={20} />
      </button>
    </div>
  </nav>

  <div
    id="mobile-nav-popover"
    bind:this={mobileNavPopover}
    popover
    class="mobile-nav"
    role="dialog"
    aria-modal="true"
    aria-label="Navigation menu"
  >
    <div class="mobile-nav-header">
      <a href={resolve('/')} class="mobile-nav-logo"><LogoCombo /></a>
      <button
        class="nav-toggle"
        popovertarget="mobile-nav-popover"
        popovertargetaction="hide"
        aria-label="Close menu"
      >
        <XIcon size={20} />
      </button>
    </div>
    <a href={resolve('/')} class="nav-link">Home</a>
    <a href={resolve('/explore')} class="nav-link">Explore</a>
    <a href={resolve('/new')} class="nav-link">New</a>

    <hr class="nav-divider" />

    {#if user.isLoggedIn && user.did}
      <a href={resolve('/profile/[user=actor]', { user: user.did })} class="nav-link" role="menuitem"
        >Profile</a
      >
      <a href={resolve('/settings')} class="nav-link" role="menuitem">Settings</a>
      <button
        type="button"
        role="menuitem"
        class="nav-link nav-link-danger"
        popovertarget="mobile-nav-popover" popovertargetaction="hide"
        onclick={() => logout()}>Logout</button
      >
    {:else}
      <a href={resolve('/login')} class="nav-link" role="menuitem">Login</a>
    {/if}
  </div>

  <main class="container">
    {@render children()}
  </main>
  <footer class="site-footer">
    <div class="container">
      <div class="footer-brand">
        <a href={resolve('/')} class="footer-logo"><LogoCombo /></a>
        <p class="footer-tagline">{TAGLINE}</p>
      </div>
      <div class="footer-links">
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">Source <MoveUpRightIcon /></a>
      </div>
    </div>
  </footer>
{/if}

<style>
  .init-screen {
    min-height: 100vh;
    display: grid;
    place-items: center;
  }

  .nav-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    background: none;
    border: 2px solid var(--foreground);
    cursor: pointer;
    color: var(--foreground);
    transition: background-color var(--ease-fast);

    &:hover {
      background: var(--bg-muted);
    }
  }

  .user-menu-trigger {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--space-1);
    transition: transform var(--ease-fast);

    &:hover {
      transform: translate(-1px, -1px);
    }
  }

  .user-menu-dropdown {
    position: fixed;
    inset: unset;
    right: var(--container-pad);
    top: calc(5rem + var(--space-2));
    margin: 0;
    background: var(--card-bg);
    border: 2px solid var(--foreground);
    box-shadow: var(--shadow-md);
    min-width: 12rem;
    filter: url('#rough');

    a,
    button {
      padding: var(--space-3) var(--space-5);
      color: var(--foreground);
      text-decoration: none;
      font-size: var(--text-lg);
      font-weight: 600;
      background: none;
      border: none;
      border-bottom: 1px solid var(--border);
      cursor: pointer;
      font-family: inherit;
      text-align: left;
      transition:
        background-color var(--ease-fast),
        color var(--ease-fast);
      display: block;
      width: 100%;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: var(--lavender);
        color: var(--lavender-vivid);
      }
    }

    .menu-item-danger {
      color: var(--danger);
      border-top: 1px solid var(--danger-bg);

      &:hover {
        background: var(--danger-bg) !important;
        color: var(--danger) !important;
      }
    }
  }

  .nav-link {
    color: var(--foreground);
    text-decoration: none;
    font-weight: 600;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    transition:
      color var(--ease-fast),
      background-color var(--ease-fast);
  }

  .navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--background);
    height: 5rem;

    .navbar-inner {
      height: 100%;
      width: 100%;
      padding-inline: var(--container-pad);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
    }

    .navbar-links {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      list-style: none;
      padding: 0;

      .nav-login {
        margin-left: var(--space-3);
      }

      .nav-link {
        padding: var(--space-2) var(--space-3);
        font-size: var(--text-base);
        &:hover {
          color: var(--accent);
        }
      }
    }

    /* Reveal toggle and hide links when appropriate. */
    .nav-toggle {
      display: none;
      flex-shrink: 0;
    }
    @media (max-width: 639px) {
      .navbar-links {
        display: none;
      }

      .nav-toggle {
        display: flex;
      }
    }
  }

  .mobile-nav {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    border: none;
    background: var(--background);
    display: none;
    flex-direction: column;
    overflow-y: auto;

    &:popover-open {
      display: flex;
    }

    .mobile-nav-header {
      height: 5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-inline: var(--container-pad);
      flex-shrink: 0;
    }

    .nav-link {
      padding: var(--space-4) var(--container-pad);
      font-size: var(--text-xl);
      width: 100%;
      display: block;
      text-align: left;

      &:hover {
        background: var(--lavender);
        color: var(--lavender-vivid);
      }
    }

    .nav-divider {
      border: none;
      border-top: 1px solid var(--border);
      margin: var(--space-2) 0;
    }

    .nav-link-danger {
      color: var(--danger);

      &:hover {
        background: var(--danger-bg) !important;
        color: var(--danger) !important;
      }
    }
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

    .footer-links a {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      gap: 0.25em;
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--fg-muted);
      text-decoration: none;

      :global(svg) {
        width: 1em;
        height: 1em;
      }

      &:hover {
        color: var(--accent);
        text-decoration: underline;
      }
    }

    @media (max-width: 639px) {
      .container {
        flex-direction: column;
        gap: var(--space-4);
      }
    }
  }
</style>
