<script lang="ts">
  import type { NotificationView } from '$lib/at';

  interface Props {
    notification: NotificationView;
  }

  let { notification }: Props = $props();

  type LabelPart = { text: string; accent?: boolean };

  let parts = $derived.by((): LabelPart[] => {
    const title = notification.userstyle?.title;
    switch (notification.reason) {
      case 'follow':
        return [{ text: 'followed you' }];
      case 'comment':
        return title
          ? [{ text: 'commented on ' }, { text: title, accent: true }]
          : [{ text: 'commented on your userstyle' }];
      case 'reply':
        return title
          ? [{ text: 'replied to your comment on ' }, { text: title, accent: true }]
          : [{ text: 'replied to your comment' }];
      case 'thread':
        return title
          ? [
              { text: 'replied in a thread on ' },
              { text: title, accent: true },
              { text: " you're in" },
            ]
          : [{ text: "replied in a thread you're in" }];
      case 'rating':
        return title
          ? [{ text: 'rated ' }, { text: title, accent: true }]
          : [{ text: 'rated your userstyle' }];
    }
  });
</script>

{#each parts as part}{#if part.accent}<span class="notification-label__title">{part.text}</span
    >{:else}{part.text}{/if}{/each}

<style>
  .notification-label__title {
    color: var(--brand-purple);
    font-weight: 600;
  }
</style>
