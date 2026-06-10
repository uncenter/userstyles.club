<script lang="ts">
  import logomark from '$assets/logomark.svg?raw';
  import logomarkWithArm from '$assets/logomark-arm.svg?raw';

  interface Props {
    size?: string;
    withArm?: boolean;
    withSpin?: boolean;
  }
  let { size = '2.5rem', withArm, withSpin }: Props = $props();
</script>

<span class={["mark", withSpin && "mark-spin"]} style="height: {size}; width: {size}" aria-hidden="true" >
  {@html withArm ? logomarkWithArm : logomark}
</span>

<style>
  .mark {
    display: inline-block;
    flex-shrink: 0;

    &.mark-spin {
      :global(svg g.wheel) {
        animation: spin 2s linear infinite;
        transform-origin: center center;
        transform-box: fill-box;
        transition: all 2s ease;

        &:hover {
          animation-play-state: paused;
        }
      }
    }
  }

  .mark :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
