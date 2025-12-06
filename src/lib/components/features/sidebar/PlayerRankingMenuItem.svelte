<script lang="ts">
  import { usePlayer } from "$lib/composables/usePlayer.svelte";
  import { isHost } from "$lib/stores/socket";
  import type { Player } from "$lib/types";

  let {
    p,
    idx,
  }: {
    p: Player;
    idx: number;
  } = $props();

  const player = usePlayer();
</script>

<div class="flex text-xs font-normal w-full justify-between">
  <div class="flex items-center gap-2 truncate">
    <span class="text-muted-foreground w-6">#{idx + 1}</span>
    <span
      class="{!$isHost && p.id === player.currentPlayer?.id && 'font-bold'} {!p.connected &&
        'opacity-20'}"
    >
      {p.name}
    </span>
  </div>
  <div
    class="text-muted-foreground"
    class:font-bold={!$isHost && p.id === player.currentPlayer?.id}
  >
    ${p.score}
  </div>
</div>
