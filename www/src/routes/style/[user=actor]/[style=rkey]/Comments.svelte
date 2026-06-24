<script lang="ts">
  import {
    user,
    createComment,
    type Comment,
    type ReviewThread,
    type UserstyleFeedback
  } from '$lib/at';

  import { Spinner, Alert } from '$components/ui';

  import CommentItem from './CommentItem.svelte';
  import type { AtUriString, DidString } from '@atproto/syntax';

  interface Props {
    userstyle: AtUriString;
    owner: DidString;
    feedback: UserstyleFeedback;
    threads: ReviewThread[];
  }

  let { userstyle, owner, feedback = $bindable(), threads }: Props = $props();

  let comment = $state('');

  let submitting = $state(false);
  let error = $state<string | null>(null);

  let isOwner = $derived(user.isLoggedIn && user.did === owner);

  async function submitComment() {
    error = null;
    submitting = true;
    try {
      let created = await createComment({ subject: userstyle, comment });
      feedback.comments.push({ uri: created.response.uri, value: created.record as Comment });
      comment = '';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to submit commit.';
    } finally {
      submitting = false;
    }
  }
</script>

<section class="page-section comments-section">
  <h2 class="comments-heading">Comments{feedback.comments.length > 0 ? ` (${feedback.comments.length})` : ''}</h2>

  {#if error}
    <Alert variant="error">{error}</Alert>
  {/if}

  {#if user.isLoggedIn && !isOwner}
    <div class="comment-form-wrapper">
      <form
        class="comment-editor-form"
        onsubmit={(e) => { e.preventDefault(); submitComment(); }}
      >
        <div class="form-group">
          <label>
            <span class="field-label">Comment</span>
            <textarea
              class="comment-textarea"
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
          class="btn btn-primary"
          disabled={submitting || !comment.trim()}
        >
          {#if submitting}<Spinner size="sm" /> Posting...{:else}Post{/if}
        </button>
      </form>
    </div>
  {/if}

  {#if threads.length === 0}
    <p class="no-comments">No comments yet.</p>
  {:else}
    <ul class="comment-list">
      {#each threads as thread (thread.comment.uri)}
        <CommentItem
          {thread}
          bind:feedback
          {userstyle}
        />
      {/each}
    </ul>
  {/if}
</section>

<style>
  .comments-section {
    margin-top: var(--space-5);

    .comments-heading {
      font-size: var(--text-2xl);
      margin-bottom: var(--space-5);
    }

    .no-comments {
      color: var(--fg-muted);
      font-size: var(--text-sm);
    }

    .comment-form-wrapper {
      margin-bottom: var(--space-6);
      padding-bottom: var(--space-6);
      border-bottom: 2px solid var(--border);

      .comment-editor-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);

        .comment-textarea {
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

    .comment-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
  }
</style>
