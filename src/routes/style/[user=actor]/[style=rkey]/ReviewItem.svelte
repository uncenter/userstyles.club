<script lang="ts">
  import type { ResourceUri } from '@atcute/lexicons';

  import {
    user,
    updateReview,
    deleteReview,
    getReviewRkey,
    getReviewAuthorDid,
    type ReviewRecord,
    type ProfileView,
    type Review
  } from '$lib/at';

  import { Spinner, Alert, Dialog } from '$components/ui';
  import { ActorHandle, StarRating, StarRatingInput } from '$components';

  import { formatDate } from '$lib/date';

  interface Props {
    review: ReviewRecord;
    reviewer: ProfileView;
    subject: ResourceUri;
    ondeleted: () => void;
  }

  let { review, reviewer, subject, ondeleted }: Props = $props();

  let isMyReview = $derived(user.isLoggedIn && user.did === getReviewAuthorDid(review.uri));

  let editing = $state(false);
  let editComment = $state('');
  let editRating = $state<number | undefined>(undefined);
  let submitting = $state(false);
  let error = $state<string | null>(null);
  let confirmDeleteOpen = $state(false);

  function startEdit() {
    editing = true;
    editComment = review.value.comment;
    editRating = review.value.rating;
  }

  function cancelEdit() {
    editing = false;
    editComment = '';
    editRating = undefined;
  }

  async function saveEdit() {
    error = null;
    submitting = true;
    try {
      let updated = await updateReview(
        getReviewRkey(review.uri),
        subject,
        editComment,
        review.value.createdAt,
        editRating
      );
      review.value = updated.record as Review;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to update review.';
    } finally {
      submitting = false;
      editing = false;
    }
  }

  async function confirmDelete() {
    confirmDeleteOpen = false;
    submitting = true;
    try {
      await deleteReview(getReviewRkey(review.uri));
      ondeleted();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to delete review.';
      submitting = false;
    }
  }
</script>

<li class="review-card">
  {#if error}
    <Alert variant="error">{error}</Alert>
  {/if}

  {#if editing}
    <form
      class="review-form"
      onsubmit={(e) => {
        e.preventDefault();
        saveEdit();
      }}
    >
      <div class="form-group">
        <StarRatingInput bind:value={editRating} />
      </div>

      <div class="form-group">
        <label class="field-label" for="review-comment"> Comment </label>
        <textarea
          id="review-comment"
          class="review-textarea"
          bind:value={editComment}
          rows="4"
          maxlength="2560"
          placeholder="Share your thoughts on this userstyle…"
          required
        ></textarea>
      </div>
      <div class="review-form-actions">
        <button
          type="submit"
          class="btn btn-primary btn-sm"
          disabled={submitting || !editComment.trim()}
        >
          {#if submitting}<Spinner size="sm" /> Saving…{:else}Save{/if}
        </button>
        <button type="button" class="btn btn-outline btn-sm" onclick={cancelEdit}> Cancel </button>
      </div>
    </form>
  {:else}
    <div class="review-header">
      <div class="reviewer-info">
        <ActorHandle profile={reviewer} />
      </div>
      <div class="review-meta">
        {#if review.value.rating !== undefined}
          <StarRating rating={review.value.rating} showValue={false} />
        {/if}
        <time class="review-date"
          >{formatDate(review.value.updatedAt ?? review.value.createdAt)}</time
        >
      </div>
    </div>
    <p class="review-comment">{review.value.comment}</p>
    {#if isMyReview}
      <div class="review-actions">
        <button type="button" class="btn btn-secondary btn-sm" onclick={startEdit}> Edit </button>
        <button
          type="button"
          class="btn btn-danger btn-sm"
          disabled={submitting}
          onclick={() => (confirmDeleteOpen = true)}
        >
          {#if submitting}<Spinner size="sm" /> Deleting…{:else}Delete{/if}
        </button>
      </div>
    {/if}
  {/if}
</li>

<Dialog bind:open={confirmDeleteOpen} title="Delete review?">
  {#snippet children()}
    <p class="text-muted">This will permanently delete your review. This cannot be undone.</p>
  {/snippet}
  {#snippet actions()}
    <button class="btn btn-outline" type="button" onclick={() => (confirmDeleteOpen = false)}>
      Cancel
    </button>
    <button class="btn btn-danger" type="button" onclick={confirmDelete}> Yes, delete! </button>
  {/snippet}
</Dialog>

<style>
  .review-card {
    padding: var(--space-4);
    border: 2px solid var(--border);

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

      .review-form-actions {
        display: flex;
        gap: var(--space-2);
      }
    }

    .review-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--space-3);
      margin-bottom: var(--space-3);

      .reviewer-info {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .review-meta {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .review-date {
        font-size: var(--text-xs);
        color: var(--fg-muted);
      }
    }

    .review-comment {
      font-size: var(--text-sm);
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .review-actions {
      display: flex;
      gap: var(--space-2);
      margin-top: var(--space-3);
    }
  }
</style>
