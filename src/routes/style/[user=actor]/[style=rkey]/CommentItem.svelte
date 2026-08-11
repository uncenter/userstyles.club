<script lang="ts">
  import { parseCanonicalResourceUri, type CanonicalResourceUri, type Did } from '@atcute/lexicons';
  import type { ComAtprotoRepoStrongRef } from '@atcute/atproto';

  import {
    user,
    getProfile,
    updateComment,
    deleteComment,
    createComment,
    type CommentRecord,
    type CommentThread,
    type ProfileView,
  } from '$lib/at';

  import { Loading, Alert, Dialog } from '$components/ui';
  import { ActorHandle, StarRating } from '$components';

  import { PencilIcon, Trash2Icon } from '@lucide/svelte';

  import Self from './CommentItem.svelte';

  import { formatDate } from '$lib/date';
  import { getLatestDate } from '$lib/at/utils';

  interface Props {
    thread: CommentThread;
    userstyle: ComAtprotoRepoStrongRef.Main;
    authors?: Map<Did, ProfileView>;
    onCommentAdded: (comment: CommentRecord) => void;
    onCommentDeleted: (uri: string) => void;
    onCommentEdited: (comment: CommentRecord) => void;
  }

  let { thread, userstyle, authors, onCommentAdded, onCommentDeleted, onCommentEdited }: Props =
    $props();

  let { repo: actor, rkey } = $derived(parseCanonicalResourceUri(thread.uri));
  let isMyComment = $derived(user.isLoggedIn && user.did === actor);

  let commenter = $derived(
    isMyComment ? user.profile! : (authors?.get(actor!) ?? (await getProfile(actor))),
  );

  let editing = $state({ state: false, value: '' });
  let replying = $state({ state: false, value: '' });

  let submitting = $state(false);
  let error = $state<string | null>(null);

  let confirmDeleteOpen = $state(false);

  function startEdit() {
    if (!thread.comment) return;
    editing.state = true;
    editing.value = thread.comment.value.comment;
  }

  function cancelEdit() {
    editing.state = false;
    editing.value = '';
  }

  async function saveEdit() {
    if (!thread.comment) return;
    error = null;
    submitting = true;
    try {
      let updated = await updateComment(rkey, {
        subject: userstyle,
        comment: editing.value,
        createdAt: thread.comment.value.createdAt,
        parent: thread.comment.value.parent,
      });
      onCommentEdited({ uri: thread.comment.uri, cid: updated.response.cid, value: updated.record });
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
    if (!thread.comment) return;
    error = null;
    submitting = true;
    try {
      let reply = await createComment({
        subject: userstyle,
        comment: replying.value,
        parent: { uri: thread.comment.uri, cid: thread.comment.cid! },
      });
      onCommentAdded({ uri: reply.response.uri as CanonicalResourceUri, value: reply.record });
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
      await deleteComment(rkey);
      onCommentDeleted(thread.uri);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to delete comment.';
    } finally {
      submitting = false;
    }
  }
</script>

{#snippet InlineEditor(
  ctx: { value: string },
  onSubmit: () => void,
  onCancel: () => void,
  submitLabel: string,
  pendingLabel: string,
)}
  <form
    class="inline-editor"
    onsubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
  >
    <textarea
      class="inline-editor__textarea"
      bind:value={ctx.value}
      rows="2"
      maxlength="2560"
      placeholder="Share your thoughts…"
      required
    ></textarea>
    <div class="inline-editor__actions">
      <button
        type="submit"
        class="btn btn--primary btn--sm"
        disabled={submitting || !ctx.value.trim()}
      >
        <Loading pending={submitting} idle={submitLabel} active="{pendingLabel}…" />
      </button>
      <button type="button" class="btn btn--outline btn--sm" onclick={onCancel}>Cancel</button>
    </div>
  </form>
{/snippet}

<li class="comment-tree">
  {#if thread.deleted}
    <div class="comment-card comment-card--deleted">
      <p class="comment-card__deleted-text">[deleted]</p>
    </div>
  {:else}
    {@const comment = thread.comment!}
    <div class="comment-card">
      {#if error}
        <Alert variant="error">{error}</Alert>
      {/if}

      <div class="comment-card__header">
        <div class="comment-card__commenter">
          <ActorHandle profile={commenter} style="small" />{#if thread.rating}
            rated <StarRating value={thread.rating} />{/if}
        </div>
        <div class="comment-card__meta">
          <time class="comment-card__date"
            >{formatDate(getLatestDate(comment.value))}</time
          >
          {#if isMyComment}
            <div class="comment-card__actions">
              <button
                type="button"
                class="btn btn--secondary btn--sm btn--icon"
                aria-label="Edit comment"
                disabled={submitting || editing.state}
                onclick={startEdit}
              >
                <PencilIcon size={14} />
              </button>
              <button
                type="button"
                class="btn btn--danger btn--sm btn--icon"
                aria-label="Delete comment"
                disabled={submitting || editing.state}
                onclick={() => (confirmDeleteOpen = true)}
              >
                <Loading pending={submitting}
                  >{#snippet idle()}<Trash2Icon size={14} />{/snippet}</Loading
                >
              </button>
            </div>
          {/if}
        </div>
      </div>
      {#if editing.state}
        {@render InlineEditor(editing, saveEdit, cancelEdit, 'Save', 'Saving')}
      {:else}
        <p class="comment-card__content">{comment.value.comment}</p>
      {/if}
      <div class="comment-card__reply">
        {#if replying.state}
          {@render InlineEditor(replying, submitReply, cancelReply, 'Reply', 'Replying')}
        {:else}
          <button
            type="button"
            class="comment-card__reply-trigger"
            disabled={submitting}
            onclick={startReply}
          >
            Reply to comment...
          </button>
        {/if}
      </div>
    </div>
  {/if}
  {#if thread.replies.length > 0}
    <ul class="comment-tree__replies">
      {#each thread.replies as reply}
        <Self
          thread={reply}
          {userstyle}
          {authors}
          {onCommentAdded}
          {onCommentDeleted}
          {onCommentEdited}
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
    <button class="btn btn--outline" type="button" onclick={() => (confirmDeleteOpen = false)}>
      Cancel
    </button>
    <button class="btn btn--danger" type="button" onclick={confirmDelete}>Yes, delete!</button>
  {/snippet}
</Dialog>

<style>
  .inline-editor {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    .inline-editor__textarea {
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

    .inline-editor__actions {
      display: flex;
      gap: var(--space-2);
    }
  }

  .comment-card {
    padding: var(--space-4);
    background: var(--bg-subtle);
    border-radius: var(--radius);

    &.comment-card--deleted {
      padding: var(--space-3) var(--space-4);
    }

    .comment-card__deleted-text {
      margin: 0;
      font-size: var(--text-sm);
      font-style: italic;
      color: var(--fg-muted);
    }

    .comment-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--space-3);
      margin-bottom: var(--space-3);

      .comment-card__commenter {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .comment-card__meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: var(--space-2);
      }

      .comment-card__date {
        font-size: var(--text-sm);
        color: var(--fg-muted);
      }

      .comment-card__actions {
        display: flex;
        gap: var(--space-1);
      }
    }

    .comment-card__content {
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .comment-card__reply {
      margin-top: var(--space-3);
      padding-top: var(--space-3);
      border-top: 1px solid var(--border);

      .comment-card__reply-trigger {
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

  .comment-tree__replies {
    list-style: none;
    padding: 0 0 0 var(--space-5);
    margin: var(--space-3) 0 0 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    border-left: 2px solid var(--border);
  }
</style>
