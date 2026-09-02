<script lang="ts">
  import { resolve } from '$app/paths';

  import { TAGLINE } from '$lib/constants';

  import { Wordmark, Logomark } from '$components/branding';

  import {
    PaintbrushIcon,
    DatabaseIcon,
    NetworkIcon,
    ImportIcon,
    ChevronDownIcon,
  } from '@lucide/svelte';

  const features = [
    {
      icon: PaintbrushIcon,
      title: 'Publish & discover',
      description:
        'Publish your own userstyles, explore the community of published userstyles from others, and rate and comment on the ones you find.',
    },
    {
      icon: ImportIcon,
      title: 'Import from wherever',
      description:
        'Already have userstyles elsewhere? Import straight from GitHub, Tangled, Userstyles.world, USo Archive, or just any CSS file on the internet.',
    },
    {
      icon: DatabaseIcon,
      title: 'Own your data',
      description:
        'Every userstyle you publish is stored as a record on your own AT Protocol Personal Data Server, so it lives under your account and stays with you.',
    },
    {
      icon: NetworkIcon,
      title: 'Built on an open protocol',
      description:
        'Built with the open AT Protocol, your userstyles are completely interoperable with other apps on the protocol.',
    },
  ];
</script>

<div class="welcome">
  <div class="welcome__mark">
    <Logomark size="8rem" />
  </div>
  <div class="welcome__text">
    <Wordmark --height="clamp(2rem, 8vw, 4rem)" />
    <p class="welcome__tagline">{TAGLINE}</p>
  </div>
  <div class="welcome__actions">
    <a href={resolve('/login')} class="btn btn--primary btn--lg">Get started</a>
    <a href={resolve('/search')} class="btn btn--outline btn--lg">Explore styles</a>
  </div>
</div>

<div class="features accent-cycle">
  {#each features as feature (feature.title)}
    <div class="feature-card">
      <span class="feature-card__icon"><feature.icon size={22} /></span>
      <p class="feature-card__title">{feature.title}</p>
      <p class="feature-card__desc">{feature.description}</p>
    </div>
  {/each}
</div>

<div class="faqs">
  <details class="faq-item">
    <summary class="faq-item__summary">
      <ChevronDownIcon size={16} class="faq-item__chevron" />
      What is a userstyle?
    </summary>
    <p class="faq-item__answer">
      A userstyle is a user-authored stylesheet (written in CSS or a CSS preprocessor language) that
      changes how a website looks, whether that's a full redesign, a dark theme, or just tweaking a
      few colors. Install a userstyle manager extension like
      <a href="https://add0n.com/stylus.html" target="_blank" rel="noopener noreferrer">Stylus</a>
      in your browser, then apply any userstyle published here to sites you visit.
    </p>
  </details>

  <details class="faq-item">
    <summary class="faq-item__summary">
      <ChevronDownIcon size={16} class="faq-item__chevron" />
      What is the AT Protocol?
    </summary>
    <p class="faq-item__answer">
      The AT Protocol is an open, federated social networking protocol. userstyles.club uses it to
      store and retrieve userstyle records in a standardized, interoperable way so that other AT
      Protocol apps can read and build on the same data.
    </p>
  </details>
</div>

<style>
  .welcome {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-8);
    padding: var(--space-12) var(--space-8);
    text-align: center;
    background: var(--card-bg);
    border-radius: var(--radius);

    @media (max-width: 639px) {
      padding: var(--space-8) var(--space-4);
      gap: var(--space-6);
    }

    .welcome__text {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
    }

    .welcome__tagline {
      font-size: var(--text-lg);
      color: var(--fg-muted);
      max-width: 32rem;
      margin-inline: auto;
      line-height: 1.6;
    }

    .welcome__actions {
      display: flex;
      gap: var(--space-3);
      justify-content: center;
      flex-wrap: wrap;
    }
  }

  .features {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
    margin-top: var(--space-4);

    @media (max-width: 639px) {
      grid-template-columns: 1fr;
    }

    .feature-card {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-5);
      background: var(--bg-subtle);
      border-radius: var(--radius);
      border-top: 3px solid var(--accent-cycle-color);
      font-size: var(--text-lg);

      .feature-card__icon {
        color: var(--accent-cycle-color);
      }

      .feature-card__title {
        font-weight: 700;
      }

      .feature-card__desc {
        color: var(--fg-muted);
        line-height: 1.6;
      }
    }
  }

  .faqs {
    margin-top: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    .faq-item {
      padding: var(--space-4) var(--space-5);
      background: var(--bg-subtle);
      border-radius: var(--radius);
      font-size: var(--text-lg);

      .faq-item__summary {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-weight: 600;
        cursor: pointer;
        list-style: none;

        &::marker,
        &::-webkit-details-marker {
          display: none;
        }

        &:hover {
          color: var(--brand-purple);
        }

        :global(.faq-item__chevron) {
          flex-shrink: 0;
          color: var(--fg-muted);
          transition: transform var(--ease-fast);
        }
      }

      &[open] .faq-item__summary :global(.faq-item__chevron) {
        transform: rotate(180deg);
      }

      .faq-item__answer {
        margin-top: var(--space-2);
        color: var(--fg-muted);
        line-height: 1.6;
      }
    }
  }
</style>
