<script lang="ts">
  import { parseResourceUri, type ResourceUri } from '@atcute/lexicons';

  import {
    user,
    getProfile,
    updateComment,
    deleteComment,
    createComment,
    type Comment,
    type ReviewThread,
    type UserstyleFeedback
  } from '$lib/at';

  import { Spinner, Alert, Dialog } from '$components/ui';
  import { ActorHandle, StarRating } from '$components';

  import { PencilIcon, Trash2Icon } from '@lucide/svelte';

  import Self from './CommentItem.svelte'

  import { formatDate } from '$lib/date';

  interface Props {
    thread: ReviewThread;
    feedback: UserstyleFeedback;
    userstyle: ResourceUri;
  }

  let { thread, feedback = $bindable(), userstyle }: Props = $props();

  let { repo: actor, rkey } = $derived(parseResourceUri(thread.comment.uri));
  let rating = $derived(feedback.ratings?.[actor!]);
  let isMyComment = $derived(user.isLoggedIn && user.did === actor);

  let commenter = $derived(isMyComment ? user.profile! : await getProfile(actor));

  let editing = $state({ state: false, value: '' });
  let replying = $state({ state: false, value: '' });

  let submitting = $state(false);
  let error = $state<string | null>(null);

  let confirmDeleteOpen = $state(false);

  function startEdit() {
    editing.state = true;
    editing.value = thread.comment.value.comment;
  }

  function cancelEdit() {
    editing.state = false;
    editing.value = '';
  }

  async function saveEdit() {
    error = null;
    submitting = true;
    try {
      let updated = await updateComment(
        rkey!,
        userstyle,
        editing.value,
        thread.comment.value.createdAt,
        thread.comment.value.parent
      );
      thread.comment.value = updated.record as Comment;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to update comment.';
    } finally {
      submitting = false;
      editing.state = false;
    }
  }

  function startReply() {
    replying.state = true;
    replying.value = '';
  }

  function cancelReply() {
    replying.state = false;
    replying.value = '';
  }

  async function submitReply() {
    error = null;
    submitting = true;
    try {
      let reply = await createComment(
        userstyle,
        replying.value,
        thread.comment.uri
      );
      feedback.comments.push({  uri: reply.response.uri, value: reply.record as Comment });
      replying.value = '';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to submit comment reply.';
    } finally {
      submitting = false;
      replying.state = false;
    }
  }

  async function confirmDelete() {
    confirmDeleteOpen = false;
    submitting = true;
    try {
      await deleteComment(rkey!);
      feedback.comments = feedback.comments.filter((c) => c.uri !== thread.comment.uri);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to delete comment.';
    } finally {
      submitting = false;
    }
  }
</script>

{#snippet InlineEditor(ctx: { value: string }, onSubmit: () => void, onCancel: () => void, submitLabel: string, pendingLabel: string)}
  <form
    class="inline-editor"
    onsubmit={(e) => { e.preventDefault(); onSubmit(); }}
  >
    <textarea
      class="inline-textarea"
      bind:value={ctx.value}
      rows="2"
      maxlength="2560"
      placeholder="Share your thoughts…"
      required
    ></textarea>
    <div class="inline-editor-actions">
      <button type="submit" class="btn btn-primary btn-sm" disabled={submitting || !ctx.value.trim()}>
        {#if submitting}<Spinner size="sm" /> {pendingLabel}...{:else}{submitLabel}{/if}
      </button>
      <button type="button" class="btn btn-outline btn-sm" onclick={onCancel}>Cancel</button>
    </div>
  </form>
{/snippet}

<li class="comment-tree">
  <div class="comment-card">
    {#if error}
      <Alert variant="error">{error}</Alert>
    {/if}

    <div class="comment-header">
      <div class="commenter-info">
        <ActorHandle profile={commenter} style='small' />{#if rating} rated <StarRating value={rating.value.rating} />{/if}
      </div>
      <div class="comment-meta">
        <time class="comment-date"
          >{formatDate(thread.comment.value.updatedAt ?? thread.comment.value.createdAt)}</time
        >
        {#if isMyComment}
          <div class="comment-actions">
            <button
              type="button"
              class="btn btn-secondary btn-sm btn-icon"
              aria-label="Edit comment"
              disabled={submitting || editing.state}
              onclick={startEdit}
            >
              <PencilIcon size={14} />
            </button>
            <button
              type="button"
              class="btn btn-danger btn-sm btn-icon"
              aria-label="Delete comment"
              disabled={submitting || editing.state}
              onclick={() => (confirmDeleteOpen = true)}
            >
              {#if submitting}<Spinner size="sm" />{:else}<Trash2Icon size={14} />{/if}
            </button>
          </div>
        {/if}
      </div>
    </div>
    {#if editing}
      {@render InlineEditor(editing, saveEdit, cancelEdit, 'Save', 'Saving')}
    {:else}
      <p class="comment-content">{thread.comment.value.comment}</p>
    {/if}
    <div class="comment-reply-section">
      {#if replying}
        {@render InlineEditor(replying, submitReply, cancelReply, 'Reply', 'Replying')}
      {:else}
        <button type="button" class="reply-trigger" disabled={submitting} onclick={startReply}>
          Reply to comment...
        </button>
      {/if}
    </div>
  </div>
  {#if thread.replies.length > 0}
    <ul class="comment-replies">
      {#each thread.replies as reply}
        <Self
          thread={reply}
          bind:feedback
          {userstyle}
        />
      {/each}
    </ul>
  {/if}
</li>

<Dialog bind:open={confirmDeleteOpen} title="Delete comment?">
  {#snippet children()}
    <p class="text-muted">This will permanently delete your comment. This cannot be undone.</p>
  {/snippet}
  {#snippet actions()}
    <button class="btn btn-outline" type="button" onclick={() => (confirmDeleteOpen = false)}>
      Cancel
    </button>
    <button class="btn btn-danger" type="button" onclick={confirmDelete}>Yes, delete!</button>
  {/snippet}
</Dialog>

<style>
  .inline-editor {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    .inline-textarea {
      width: 100%;
      padding: var(--space-2) var(--space-3);
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

    .inline-editor-actions {
      display: flex;
      gap: var(--space-2);
    }
  }

  .comment-card {
    padding: var(--space-4);
    background: var(--bg-subtle);
    border-radius: var(--radius);

    .comment-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--space-3);
      margin-bottom: var(--space-3);

      .commenter-info {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .comment-meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: var(--space-2);
      }

      .comment-date {
        font-size: var(--text-sm);
        color: var(--fg-muted);
      }

      .comment-actions {
        display: flex;
        gap: var(--space-1);
      }
    }

    .comment-content {
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .comment-reply-section {
      margin-top: var(--space-3);
      padding-top: var(--space-3);
      border-top: 1px solid var(--border);

      .reply-trigger {
        display: block;
        width: 100%;
        padding: var(--space-2) var(--space-3);
        background: var(--bg-muted);
        border-radius: var(--radius-sm);
        border: none;
        text-align: left;
        font-size: var(--text-sm);
        color: var(--fg-muted);
        cursor: pointer;

        &:hover:not(:disabled) {
          background: var(--bg-faint);
          color: var(--foreground);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }

  .comment-replies {
    list-style: none;
    padding: 0 0 0 var(--space-5);
    margin: var(--space-3) 0 0 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    border-left: 2px solid var(--border);
  }
</style>
