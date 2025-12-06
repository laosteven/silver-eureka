<script lang="ts">
  import { usePlayer } from "$lib/composables/usePlayer.svelte";
  import { gameState, isHost } from "$lib/stores/socket";
  import type { Player } from "$lib/types";
  import type { ClassValue } from "svelte/elements";

  let {
    p,
    idx,
    class: className,
  }: {
    p: Player;
    idx: number;
    class?: ClassValue | null | undefined;
  } = $props();

  const player = usePlayer();
</script>

<div class="{className} flex text-xs font-normal w-full justify-between">
  <div class="flex items-center gap-2 truncate">
    {#if $gameState.scoringEnabled || $gameState.gamePhase === "leaderboard"}
      <span class="text-muted-foreground w-6">#{idx + 1}</span>
    {/if}
    <span
      class="{!$isHost && p.id === player.currentPlayer?.id && 'font-bold'} {!p.connected &&
        'opacity-20'}"
    >
      {p.name}
    </span>
  </div>
  {#if $gameState.scoringEnabled || $gameState.gamePhase === "leaderboard"}
    <div
      class="text-muted-foreground"
      class:font-bold={!$isHost && p.id === player.currentPlayer?.id}
    >
      ${p.score}
    </div>
  {/if}
</div>
