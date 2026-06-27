<script lang="ts">
  import { type Did, type ResourceUri } from '@atcute/lexicons';

  import {
    user,
    createComment,
    type CommentRecord,
    type ReviewThread,
    type UserstyleFeedback,
  } from '$lib/at';

  import { Spinner, Alert } from '$components/ui';

  import CommentItem from './CommentItem.svelte';

  interface Props {
    userstyle: ResourceUri;
    owner: Did;
    feedback: UserstyleFeedback;
    threads: ReviewThread[];
    onCommentAdded: (comment: CommentRecord) => void;
    onCommentDeleted: (uri: string) => void;
  }

  let { userstyle, owner, feedback, threads, onCommentAdded, onCommentDeleted }: Props = $props();

  let comment = $state('');

  let submitting = $state(false);
  let error = $state<string | null>(null);

  let isOwner = $derived(user.isLoggedIn && user.did === owner);

  async function submitComment() {
    error = null;
    submitting = true;
    try {
      let created = await createComment({ subject: userstyle, comment });
      onCommentAdded({ uri: created.response.uri, value: created.record });
      comment = '';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to submit commit.';
    } finally {
      submitting = false;
    }
  }
</script>

<section class="page-section comments-section">
  <h2 class="comments-section__heading">Comments{feedback.comments.length > 0 ? ` (${feedback.comments.length})` : ''}</h2>

  {#if error}
    <Alert variant="error">{error}</Alert>
  {/if}

  {#if user.isLoggedIn && !isOwner}
    <div class="comments-section__form-wrapper">
      <form
        class="comments-section__form"
        onsubmit={(e) => { e.preventDefault(); submitComment(); }}
      >
        <div class="form-group">
          <label>
            <span class="form-field-label">Comment</span>
            <textarea
              class="comments-section__textarea"
              bind:value={comment}
              rows="3"
              maxlength="2560"
              placeholder="Share your thoughts on this userstyle…"
              required
            ></textarea>
          </label>
        </div>
        <button
          type="submit"
          class="btn btn--primary"
          disabled={submitting || !comment.trim()}
        >
          {#if submitting}<Spinner size="sm" /> Posting…{:else}Post{/if}
        </button>
      </form>
    </div>
  {/if}

  {#if threads.length === 0}
    <p class="comments-section__empty">No comments yet.</p>
  {:else}
    <ul class="comments-section__list list-reset">
      {#each threads as thread (thread.comment.uri)}
        <CommentItem
          {thread}
          ratings={feedback.ratings}
          {userstyle}
          {onCommentAdded}
          {onCommentDeleted}
        />
      {/each}
    </ul>
  {/if}
</section>

<style>
  .comments-section {
    margin-top: var(--space-5);

    .comments-section__heading {
      font-size: var(--text-2xl);
      margin-bottom: var(--space-5);
    }

    .comments-section__empty {
      color: var(--fg-muted);
      font-size: var(--text-sm);
    }

    .comments-section__form-wrapper {
      margin-bottom: var(--space-6);
      padding-bottom: var(--space-6);
      border-bottom: 2px solid var(--border);

      .comments-section__form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);

        .comments-section__textarea {
          width: 100%;
          padding: var(--space-3);
          border: 2px solid var(--input-border);
          border-radius: var(--radius-sm);
          background: var(--background);
          color: var(--foreground);
          font-family: inherit;
          font-size: var(--text-sm);
          resize: vertical;

          &:focus {
            outline: none;
            border-color: var(--ring);
            box-shadow: 3px 3px 0 var(--brand-purple);
          }
        }
      }
    }

    .comments-section__list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
  }
</style>
