<script lang="ts">
  import { CLUB_BRAND_DID, joinPageTitle, TAGLINE, CLUB_AUTHOR_DID } from '$lib/constants';
  import {
    CLUB_USERSTYLE_COLLECTION,
    CLUB_PROFILE_COLLECTION,
    CLUB_COMMENT_COLLECTION,
    CLUB_RATING_COLLECTION,
  } from '$lib/at/settings';

  import type { Snippet } from 'svelte';
  import { getProfile } from '$lib/at';
  import { ActorHandle } from '$components';

  function pdslsLexiconUrl(nsid: string) {
    return `https://pdsls.dev/at://${CLUB_BRAND_DID}/com.atproto.lexicon.schema/${nsid}`;
  }
</script>

<svelte:head>
  <title>{joinPageTitle('About')}</title>
</svelte:head>

{#snippet FaqItem(question: string, answer: string | Snippet<[]>)}
  <div class="faq__item">
    <dt class="faq__question">{question}</dt>
    <dd class="faq__answer">
      {#if typeof answer === 'string'}
        {answer}
      {:else}
        {@render answer()}
      {/if}
    </dd>
  </div>
{/snippet}

{#snippet LexiconItem(title: string, nsid: string)}
  <a class="lexicon-card" href={pdslsLexiconUrl(nsid)} target="_blank" rel="noopener noreferrer">
    <span class="lexicon-card__title">{title}</span>
    <span class="lexicon-card__desc">{nsid}</span>
  </a>
{/snippet}

<div class="about">
  <h1 class="about__title">About</h1>

  <section class="about-section">
    <dl class="faq">
      {@render FaqItem(
        'What is userstyles.club?',
        'A website for sharing, discovering, and installing userstyles. Publish your own userstyles, explore the community of published userstyles from others, rate and comment the userstyles you find, and more.',
      )}
      {@render FaqItem(
        'Why use userstyles.club over other hosting sites?',
        'All userstyles you publish are stored as records on your AT Protocol Personal Data Server (PDS). That means your data lives under your account and stays with you, regardless of what happens to userstyles.club.',
      )}
      {@render FaqItem(
        'How does signing in with Bluesky work?',
        'userstyles.club uses your existing Bluesky / AT Protocol account, with no separate signup required. You authorize userstyles.club to read and write only our own userstyles.club records on your behalf.',
      )}
      {@render FaqItem(
        'What is the AT Protocol?',
        'The AT Protocol is an open, federated social networking protocol. userstyles.club uses it to store and retrieve userstyle records in a standardized, interoperable way so that other AT Protocol apps can read and build on the same data.',
      )}

      {#snippet authorFaqAnswer()}
        userstyles.club is made by me, <ActorHandle
          profile={await getProfile(CLUB_AUTHOR_DID)}
          style="small"
        />. Say hi on Bluesky!
      {/snippet}
      {@render FaqItem('Who develops userstyles.club?', authorFaqAnswer)}
    </dl>
  </section>

  <section class="about-section">
    <h2 class="about-section__heading">Lexicons</h2>
    <p class="about-section__body">
      userstyles.club defines its own AT Protocol lexicons, published on the club's brand account.
      These schemas describe the structure of all records the app reads and writes.
    </p>
    <div class="lexicon-cards accent-cycle">
      {@render LexiconItem('Userstyles', CLUB_USERSTYLE_COLLECTION)}
      {@render LexiconItem('Profiles', CLUB_PROFILE_COLLECTION)}
      {@render LexiconItem('Comments', CLUB_COMMENT_COLLECTION)}
      {@render LexiconItem('Ratings', CLUB_RATING_COLLECTION)}
    </div>
  </section>
</div>

<style>
  .about {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    max-width: 48rem;
    margin-inline: auto;

    .about__title {
      font-size: var(--text-4xl);
    }
  }

  .about-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-6) 0;

    &:not(:last-of-type) {
      border-bottom: 1px solid var(--border);
    }

    .about-section__heading {
      font-size: var(--text-2xl);
      font-weight: 700;
    }

    .about-section__body {
      color: var(--fg-muted);
      font-size: var(--text-lg);
      line-height: 1.7;
    }
  }

  .faq {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);

    .faq__item {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .faq__question {
      font-weight: 700;
      color: var(--foreground);
      font-size: var(--text-2xl);
    }

    .faq__answer {
      color: var(--fg-muted);
      line-height: 1.7;
      font-size: var(--text-lg);

      :global .actor-handle {
        vertical-align: center;
        margin-left: 0.5ch;
      }
    }
  }

  .lexicon-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-top: var(--space-3);

    @media (max-width: 500px) {
      grid-template-columns: 1fr;
    }

    .lexicon-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-4);
      background: var(--bg-subtle);
      border-radius: var(--radius);
      text-decoration: none;
      transition: background-color var(--ease-fast);
      min-width: 0;

      border-top: 3px solid var(--accent-cycle-color);

      &:hover {
        background: var(--bg-muted);
      }

      .lexicon-card__title {
        font-weight: 700;
        color: var(--foreground);
        font-size: var(--text-lg);
      }

      .lexicon-card__desc {
        color: var(--fg-muted);
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        word-break: break-all;
        text-transform: uppercase;
      }
    }
  }
</style>
