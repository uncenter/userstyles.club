<script lang="ts">
  import type { Did, ResourceUri } from '@atcute/lexicons';

  import {
    user,
    createReview,
    getReviewAuthorDid,
    type ReviewRecord,
    type ProfileView,
    type Review
  } from '$lib/at';

  import { Spinner, Alert } from '$components/ui';
  import { StarRatingInput } from '$components';
  import ReviewItem from './ReviewItem.svelte';

  interface Props {
    subject: ResourceUri;
    owner: Did;
    reviews: ReviewRecord[];
    reviewers: Record<string, ProfileView>;
  }

  let { subject, owner, reviews: initialReviews, reviewers: initialReviewers }: Props = $props();

  let reviews = $state(initialReviews);
  let reviewers = $state(initialReviewers);

  let reviewComment = $state('');
  let reviewRating = $state<number | undefined>(undefined);

  let submitting = $state(false);
  let error = $state<string | null>(null);

  let isOwner = $derived(user.isLoggedIn && user.did === owner);
  let myReview = $derived(
    user.isLoggedIn && user.did
      ? (reviews.find((r) => getReviewAuthorDid(r.uri) === user.did) ?? null)
      : null
  );

  async function submitReview() {
    error = null;
    submitting = true;
    try {
      let created = await createReview(subject, reviewComment, reviewRating);
      reviews.push({ uri: created.response.uri, value: created.record as Review });
      reviewers[user.did!] = user.profile!;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to submit review.';
    } finally {
      submitting = false;
    }
  }
</script>

<section class="page-section reviews-section">
  <h2 class="reviews-heading">Reviews{reviews.length > 0 ? ` (${reviews.length})` : ''}</h2>

  {#if error}
    <Alert variant="error">{error}</Alert>
  {/if}

  {#if user.isLoggedIn && !isOwner && !myReview}
    <div class="review-form-wrapper">
      <h3 class="review-form-heading">Write a Review</h3>
      <form
        class="review-form"
        onsubmit={(e) => {
          e.preventDefault();
          submitReview();
        }}
      >
        <div class="form-group">
          <StarRatingInput bind:value={reviewRating} />
        </div>

        <div class="form-group">
          <label class="field-label" for="review-comment"> Comment </label>
          <textarea
            id="review-comment"
            class="review-textarea"
            bind:value={reviewComment}
            rows="4"
            maxlength="2560"
            placeholder="Share your thoughts on this userstyle…"
            required
          ></textarea>
        </div>
        <button
          type="submit"
          class="btn btn-primary"
          disabled={submitting || !reviewComment.trim()}
        >
          {#if submitting}<Spinner size="sm" /> Submitting…{:else}Submit Review{/if}
        </button>
      </form>
    </div>
  {/if}

  {#if reviews.length === 0}
    <p class="no-reviews">No reviews yet.</p>
  {:else}
    <ul class="review-list">
      {#each reviews as review (review.uri)}
        {@const author = getReviewAuthorDid(review.uri)}
        <ReviewItem
          {review}
          reviewer={reviewers[author]}
          {subject}
          ondeleted={() => {
            reviews = reviews.filter((r) => r.uri !== review.uri);
          }}
        />
      {/each}
    </ul>
  {/if}
</section>

<style>
  .reviews-section {
    margin-top: var(--space-5);

    .reviews-heading {
      font-size: var(--text-2xl);
      margin-bottom: var(--space-5);
    }

    .no-reviews {
      color: var(--fg-muted);
      font-size: var(--text-sm);
    }

    .review-form-wrapper {
      margin-bottom: var(--space-6);
      padding-bottom: var(--space-6);
      border-bottom: 2px solid var(--border);

      .review-form-heading {
        font-size: var(--text-lg);
        margin-bottom: var(--space-4);
      }

      .review-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);

        .review-textarea {
          width: 100%;
          padding: var(--space-3);
          border: 2px solid var(--border);
          background: var(--background);
          color: var(--foreground);
          font-family: inherit;
          font-size: var(--text-sm);
          resize: vertical;

          &:focus {
            outline: none;
            border-color: var(--foreground);
          }
        }
      }
    }

    .review-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
  }
</style>
