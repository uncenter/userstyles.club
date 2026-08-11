<script lang="ts">
  import { onMount } from 'svelte';
  import { afterNavigate, goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import '../app.css';

  import type { Did } from '@atcute/lexicons';
  import {
    initClient,
    user,
    logout,
    listNotifications,
    getProfiles,
    type NotificationView,
    type ProfileView,
  } from '$lib/at';
  import { preferences, getPreferredActorIdentifier } from '$lib/preferences.svelte';
  import { labelForNotification, hrefForNotification } from '$lib/notifications';
  import { formatDateTimeRelative } from '$lib/date';
  import { TAGLINE, REPO_URL, FEEDBACK_URL } from '$lib/constants';

  import { LogoCombo } from '$components/branding';
  import { Spinner, Avatar, Alert } from '$components/ui';
  import { ActorHandle } from '$components';

  import { MenuIcon, MoveUpRightIcon, SearchIcon, InboxIcon, XIcon } from '@lucide/svelte';

  let navSearchQuery = $state('');
  let mobileNavSearchQuery = $state('');

  function submitNavSearch(query: string) {
    const q = query.trim();
    goto(resolve('/search') + (q ? `?q=${encodeURIComponent(q)}` : ''));
  }

  let notifTrayItems = $state<NotificationView[] | undefined>(undefined);
  let notifTrayProfiles = $state(new Map<Did, ProfileView>());
  let notifTrayError = $state<string | null>(null);
  let hasUnreadNotifications = $derived(
    notifTrayItems !== undefined &&
      notifTrayItems.length > 0 &&
      notifTrayItems[0].indexedAt > preferences.get('lastViewedNotificationsAt'),
  );

  $effect(() => {
    if (!user.isLoggedIn || !user.did) return;
    notifTrayError = null;
    listNotifications(user.did, { limit: 8 })
      .then(async (page) => {
        // Resolve profiles so every notification can be rendered with a matching profile.
        const profiles = await getProfiles(page.notifications.map((n) => n.author));
        notifTrayItems = page.notifications;
        notifTrayProfiles = profiles;
      })
      .catch((e) => {
        notifTrayItems = [];
        notifTrayError = e instanceof Error ? e.message : 'Failed to load notifications.';
      });
  });

  let { children } = $props();

  $effect(() => {
    const val = preferences.get('appearance');
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
  let notifTrayPopover: HTMLElement | undefined = $state();
  let mobileNavPopover: HTMLElement | undefined = $state();

  afterNavigate(() => {
    if (mobileNavPopover?.matches(':popover-open')) {
      mobileNavPopover.hidePopover();
    } else if (userMenuPopover?.matches(':popover-open')) {
      userMenuPopover.hidePopover();
    } else if (notifTrayPopover?.matches(':popover-open')) {
      notifTrayPopover.hidePopover();
    }
  });

  onMount(async () => {
    await initClient();
  });
</script>

<svelte:head>
  <title>userstyles.club</title>
  <meta name="description" content={TAGLINE} />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=20260615" />
  <link rel="icon" type="image/png" href="/favicon-96x96.png?v=20260615" sizes="96x96" />
  <link rel="shortcut icon" href="/favicon.ico?v=20260615" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=20260615" />
  <meta name="apple-mobile-web-app-title" content="userstyles.club" />
  <link rel="manifest" href="/site.webmanifest?v=20260615" />
</svelte:head>

{#if user.isInitializing}
  <div class="init-screen">
    <Spinner size="lg" />
  </div>
{:else}
  <nav class="navbar">
    <div class="navbar__stripe accent-cycle" aria-hidden="true">
      <span class="navbar__stripe-segment"></span><span class="navbar__stripe-segment"></span><span
        class="navbar__stripe-segment"
      ></span><span class="navbar__stripe-segment"></span>
    </div>
    <div class="navbar__inner">
      <a href={resolve('/')} class="navbar__logo"><LogoCombo /></a>

      <div class="navbar__end">
        <form
          class="navbar__search form-input-group"
          onsubmit={(e) => {
            e.preventDefault();
            submitNavSearch(navSearchQuery);
          }}
        >
          <input
            type="text"
            class="form-input-group__input"
            placeholder="Search userstyles…"
            aria-label="Search userstyles"
            bind:value={navSearchQuery}
          />
          <button type="submit" class="form-input-group__btn" aria-label="Search">
            <SearchIcon size={16} />
          </button>
        </form>

        <ul class="navbar__links" role="list">
          <li><a href={resolve('/')} class="navbar__link">Home</a></li>
          <li><a href={resolve('/explore')} class="navbar__link">Explore</a></li>
          <li><a href={resolve('/new')} class="btn btn--primary">New</a></li>
          {#if user.isLoggedIn && user.did}
            <li class="notif-bell">
              <button
                class="notif-bell__trigger"
                popovertarget="notif-tray-popover"
                popovertargetaction="toggle"
                aria-haspopup="menu"
                aria-label="Notifications"
              >
                <InboxIcon size={18} />
                {#if hasUnreadNotifications}<span class="notif-bell__dot" aria-hidden="true"
                  ></span>{/if}
              </button>
              <div
                id="notif-tray-popover"
                bind:this={notifTrayPopover}
                popover
                class="notif-tray"
                role="menu"
              >
                {#if notifTrayItems === undefined}
                  <div class="notif-tray__loading"><Spinner size="sm" /></div>
                {:else if notifTrayError}
                  <div class="notif-tray__error"><Alert variant="error">{notifTrayError}</Alert></div>
                {:else if notifTrayItems.length === 0}
                  <p class="notif-tray__empty text-muted">No notifications yet.</p>
                {:else}
                  <ul class="notif-tray__list list-reset" role="list">
                    {#each notifTrayItems as n (n.recordUri)}
                      {@const profile = notifTrayProfiles.get(n.author)!}
                      <li>
                        <a href={hrefForNotification(n, profile)} class="notif-tray__item">
                          <ActorHandle {profile} style="minimal" />
                          <span class="notif-tray__label">{labelForNotification(n.reason)}</span>
                          <span class="notif-tray__date">{formatDateTimeRelative(n.indexedAt)}</span
                          >
                        </a>
                      </li>
                    {/each}
                  </ul>
                {/if}
                <a href={resolve('/notifications')} class="notif-tray__view-all">View all</a>
              </div>
            </li>
            <li class="user-menu">
              <button
                class="user-menu__trigger"
                popovertarget="user-menu-popover"
                popovertargetaction="toggle"
                aria-haspopup="menu"
                aria-label="User menu"
              >
                <Avatar
                  src={user.profile?.avatar}
                  name={user.profile?.handle ?? user.profile?.did ?? ''}
                  alt={user.profile?.handle ?? user.profile?.did ?? 'profile'}
                  size="md"
                />
              </button>
              <div
                id="user-menu-popover"
                bind:this={userMenuPopover}
                popover
                class="user-menu__dropdown"
                role="menu"
              >
                <a
                  class="user-menu__item"
                  href={resolve('/profile/[user=actor]', {
                    user: getPreferredActorIdentifier(user.profile),
                  })}
                  role="menuitem">Profile</a
                >
                <a class="user-menu__item" href={resolve('/settings')} role="menuitem">Settings</a>
                <button
                  type="button"
                  role="menuitem"
                  class="user-menu__item user-menu__item--danger"
                  popovertarget="user-menu-popover"
                  popovertargetaction="hide"
                  onclick={() => logout()}>Logout</button
                >
              </div>
            </li>
          {:else}
            <li class="navbar__login">
              <a href={resolve('/login')} class="btn btn--outline">Login</a>
            </li>
          {/if}
        </ul>

        <button
          class="navbar__toggle"
          popovertarget="mobile-nav-popover"
          popovertargetaction="toggle"
          aria-haspopup="menu"
          aria-label="Navigation menu"
        >
          <MenuIcon size={20} />
        </button>
      </div>
    </div>
  </nav>

  <main class="container">
    <div
      id="mobile-nav-popover"
      bind:this={mobileNavPopover}
      popover
      class="mobile-nav"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      <form
        class="mobile-nav__search form-input-group"
        onsubmit={(e) => {
          e.preventDefault();
          submitNavSearch(mobileNavSearchQuery);
        }}
      >
        <input
          type="text"
          class="form-input-group__input"
          placeholder="Search userstyles…"
          aria-label="Search userstyles"
          bind:value={mobileNavSearchQuery}
        />
        <button type="submit" class="form-input-group__btn" aria-label="Search">
          <SearchIcon size={16} />
        </button>
      </form>

      <a href={resolve('/')} class="mobile-nav__link">Home</a>
      <a href={resolve('/explore')} class="mobile-nav__link">Explore</a>
      <a href={resolve('/new')} class="mobile-nav__link">New</a>

      <hr class="mobile-nav__divider" />

      {#if user.isLoggedIn && user.did}
        <a href={resolve('/notifications')} class="mobile-nav__link" role="menuitem">
          Notifications
          {#if hasUnreadNotifications}<span class="notif-bell__dot" aria-hidden="true"></span>{/if}
        </a>
        <a
          href={resolve('/profile/[user=actor]', {
            user: getPreferredActorIdentifier(user.profile),
          })}
          class="mobile-nav__link"
          role="menuitem">Profile</a
        >
        <a href={resolve('/settings')} class="mobile-nav__link" role="menuitem">Settings</a>
        <button
          type="button"
          role="menuitem"
          class="mobile-nav__link mobile-nav__link--danger"
          popovertarget="mobile-nav-popover"
          popovertargetaction="hide"
          onclick={() => logout()}>Logout</button
        >
      {:else}
        <a href={resolve('/login')} class="mobile-nav__link" role="menuitem">Login</a>
      {/if}
    </div>
    {@render children()}
  </main>
  <footer class="site-footer">
    <div class="container">
      <div class="site-footer__brand">
        <a href={resolve('/')} class="site-footer__logo"><LogoCombo /></a>
        <p class="site-footer__tagline">{TAGLINE}</p>
      </div>
      <div class="site-footer__links">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn--outline btn--primary btn--sm">Source <MoveUpRightIcon size={16} /></a
        >
        <a
          href={FEEDBACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn--outline btn--primary btn--sm">Feedback <MoveUpRightIcon size={16} /></a
        >
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

  .navbar__toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    background: none;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    color: var(--foreground);
    transition: background-color var(--ease-fast);

    &:hover {
      background: var(--bg-muted);
    }
  }

  .notif-bell__trigger {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    background: none;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    color: var(--foreground);
    transition: background-color var(--ease-fast);

    &:hover {
      background: var(--bg-muted);
    }

    .notif-bell__dot {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: var(--danger);
    }
  }

  .mobile-nav__link .notif-bell__dot {
    display: inline-block;
    margin-left: var(--space-2);
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: var(--danger);
    vertical-align: middle;
  }

  .notif-tray {
    position: fixed;
    inset: unset;
    right: var(--container-pad);
    top: calc(var(--nav-height) + var(--space-2));
    margin: 0;
    padding: 0;
    background: var(--float-bg);
    border: none;
    border-radius: var(--radius);
    width: 20rem;
    max-width: calc(100vw - 2 * var(--container-pad));
    overflow: hidden;

    .notif-tray__loading,
    .notif-tray__empty {
      padding: var(--space-4);
      text-align: center;
    }

    .notif-tray__error {
      padding: var(--space-2);
    }

    .notif-tray__list {
      max-height: 22rem;
      overflow-y: auto;
    }

    .notif-tray__item {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      flex-wrap: wrap;
      width: 100%;
      padding: var(--space-2) var(--space-4);
      background: none;
      border: none;
      text-align: left;
      text-decoration: none;
      color: var(--foreground);
      font: inherit;
      font-size: var(--text-sm);
      cursor: pointer;
      transition: background-color var(--ease-fast);

      &:hover {
        background: var(--bg-muted);
      }

      .notif-tray__label {
        color: var(--fg-muted);
      }

      .notif-tray__date {
        margin-left: auto;
        font-size: var(--text-xs);
        color: var(--fg-muted);
        flex-shrink: 0;
      }
    }

    .notif-tray__view-all {
      display: block;
      padding: var(--space-3) var(--space-4);
      text-align: center;
      font-weight: 600;
      font-size: var(--text-sm);
      color: var(--brand-purple);
      text-decoration: none;
      border-top: 2px solid var(--border);

      &:hover {
        background: var(--bg-muted);
      }
    }
  }

  .user-menu__trigger {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
  }

  .user-menu__dropdown {
    position: fixed;
    inset: unset;
    right: var(--container-pad);
    top: calc(var(--nav-height) + var(--space-2));
    margin: 0;
    background: var(--float-bg);
    border: none;
    border-radius: var(--radius);
    min-width: 12rem;
    overflow: hidden;

    .user-menu__item {
      padding: var(--space-3) var(--space-4);
      color: var(--foreground);
      text-decoration: none;
      font-size: var(--text-base);
      font-weight: 600;
      background: none;
      border: none;
      cursor: pointer;
      font-family: inherit;
      text-align: left;
      transition:
        background-color var(--ease-fast),
        color var(--ease-fast);
      display: block;
      width: 100%;

      &:hover {
        background: var(--brand-purple-bg);
        color: var(--brand-purple);
      }
    }

    .user-menu__item--danger {
      color: var(--danger);

      &:hover {
        background: var(--danger-bg) !important;
        color: var(--danger) !important;
      }
    }
  }

  .navbar__link,
  .mobile-nav__link {
    color: var(--foreground);
    text-decoration: none;
    font-weight: 600;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    border-radius: var(--radius-sm);
    transition:
      color var(--ease-fast),
      background-color var(--ease-fast);
  }

  .navbar__stripe {
    display: flex;
    height: 4px;
    flex-shrink: 0;

    .navbar__stripe-segment {
      flex: 1;
      background: var(--accent-cycle-color);
    }
  }

  .navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--nav-bg);

    .navbar__inner {
      height: calc(var(--nav-height) - 4px);
      width: 100%;
      padding-inline: var(--container-pad);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
    }

    .navbar__end {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      min-width: 0;
    }

    .navbar__search {
      width: 14rem;
      flex-shrink: 1;
      min-width: 0;

      .form-input-group__input,
      .form-input-group__btn {
        padding-top: calc(var(--space-1) + 1px);
        padding-bottom: calc(var(--space-1) + 1px);
      }
    }

    .navbar__links {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      list-style: none;
      padding: 0;

      .navbar__login,
      .notif-bell {
        margin-left: var(--space-2);
      }

      .navbar__link {
        padding: var(--space-2) var(--space-3);
        font-size: var(--text-base);

        &:hover {
          background: var(--bg-muted);
          color: var(--brand-purple);
        }
      }
    }

    /* Reveal toggle and hide links when appropriate. */
    .navbar__toggle {
      display: none;
      flex-shrink: 0;
    }
    @media (max-width: 639px) {
      .navbar__search,
      .navbar__links {
        display: none;
      }

      .navbar__toggle {
        display: flex;
      }
    }
  }

  .mobile-nav {
    position: fixed;
    inset: var(--nav-height) 0 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    border: none;
    background: var(--nav-bg);
    display: none;
    flex-direction: column;
    overflow-y: auto;

    &:popover-open {
      display: flex;
    }

    .mobile-nav__search {
      padding: var(--space-6) var(--space-8) 0;
    }

    .mobile-nav__link {
      padding: var(--space-6) var(--space-8);
      font-size: var(--text-3xl);
      width: 100%;
      display: block;
      text-align: left;
      border-radius: 0;

      &:hover {
        background: var(--brand-purple-bg);
        color: var(--brand-purple);
      }
    }

    .mobile-nav__divider {
      border: none;
      border-top: 2px solid var(--border);
      margin: var(--space-2) 0;
    }

    .mobile-nav__link--danger {
      color: var(--danger);

      &:hover {
        background: var(--danger-bg) !important;
        color: var(--danger) !important;
      }
    }
  }

  .site-footer {
    padding: var(--space-6) 0;
    background: var(--bg-subtle);

    .container {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-8);
    }

    .site-footer__brand {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);

      .site-footer__logo {
        display: flex;
        align-items: center;
        opacity: 0.65;
        transition: opacity var(--ease-fast);

        &:hover {
          opacity: 1;
        }
      }

      .site-footer__tagline {
        font-size: var(--text-sm);
        color: var(--fg-muted);
        max-width: 28rem;
        line-height: 1.5;
        margin: 0;
      }
    }

    .site-footer__links {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      align-items: center;
    }

    @media (max-width: 639px) {
      .container {
        flex-direction: column;
        gap: var(--space-4);
      }
    }
  }
</style>
