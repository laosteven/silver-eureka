<script lang="ts">
  import { gameState } from "$lib/stores/socket";
  import { LottiePlayer } from "@lottiefiles/svelte-lottie-player";

  const p = $props<{ name: string; score: number; rank: number; totalPlayers: number }>();
</script>

<div class="text-center space-y-4">
  <LottiePlayer src="/animations/search.json" autoplay loop style="display: inline-block" />
  <div class="bg-secondary p-4 rounded-lg">
    <p class="text-sm text-muted-foreground">Your score</p>
    <p class="text-4xl font-bold text-purple-600">${p.score}</p>
  </div>

  {#if $gameState.scoringEnabled}
    <div class="bg-secondary p-4 rounded-lg">
      <p class="text-sm text-muted-foreground">Your rank</p>
      <p class="text-2xl font-bold">#{p.rank} of {p.totalPlayers}</p>
    </div>
  {/if}
</div>
