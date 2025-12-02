<script lang="ts">
  import { browser } from "$app/environment";
  import BuzzerButton from "$lib/components/features/game/BuzzerButton.svelte";
  import PlayerStats from "$lib/components/features/player/PlayerStats.svelte";
  import RenameModal from "$lib/components/features/player/RenameModal.svelte";
  import { Button } from "$lib/components/ui/button";
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import { usePlayer } from "$lib/composables/usePlayer.svelte";
  import {
    connected,
    gameConfig,
    gameState,
    hostNotification,
    initSocket,
    joinError,
  } from "$lib/stores/socket";
  import { onMount } from "svelte";
  import { Toaster, toast } from "svelte-sonner";

  const player = usePlayer();

  onMount(() => {
    if (browser) {
      initSocket();
      player.init();
    }
  });

  async function handleJoin() {
    if (player.username.trim()) {
      await player.join(player.username);
      // Error handling is done in the composable
    }
  }

  function handleBuzz() {
    player.doBuzz();
  }

  // Reset buzzed state when question changes or phase changes
  $effect(() => {
    if ($gameState.gamePhase !== "question") {
      player.resetBuzz();
    }
  });

  // Show toast notification when host updates something
  $effect(() => {
    if ($hostNotification) {
      toast.info($hostNotification.message, { dismissable: true });
    }
  });
</script>

<div
  class="min-h-screen bg-gradient-to-br from-purple-900 to-purple-700 p-4 flex items-center justify-center"
>
  {#if !$connected}
    <Card class="w-full max-w-md">
      <CardContent class="p-8 text-center">
        <p class="text-xl">Connecting to server...</p>
      </CardContent>
    </Card>
  {:else if !player.hasJoined}
    <!-- Username Entry -->
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-3xl font-bold text-purple-600">{$gameConfig.title}</CardTitle>
        <CardDescription>Enter your name to join the game</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onsubmit={(e) => {
            e.preventDefault();
            handleJoin();
          }}
          class="space-y-4"
        >
          <Input
            type="text"
            placeholder="Your name"
            bind:value={player.username}
            maxlength={20}
            class="text-lg py-6"
          />
          {#if $joinError}
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p class="text-sm font-semibold">{$joinError}</p>
            </div>
          {/if}
          <Button type="submit" class="w-full text-lg py-6" disabled={!player.username.trim()}>
            Join game
          </Button>
        </form>

        <p class="text-muted-foreground mt-4 text-sm text-center">
          Make sure to use a unique name to keep your score!
        </p>
      </CardContent>
    </Card>
  {:else if $gameState.gamePhase === "lobby"}
    <!-- Waiting in Lobby -->
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-2xl">{$gameConfig.title}</CardTitle>
        <CardDescription>Waiting for host to start the game...</CardDescription>
      </CardHeader>
      <CardContent class="text-center space-y-4">
        <div class="text-6xl mb-4">⏳</div>
        <p class="text-xl font-semibold mb-2">
          Welcome, {player.currentPlayer?.name}!
        </p>
        <p class="text-muted-foreground">
          {$gameState.players.length} player(s) joined
        </p>
        <RenameModal
          value={player.currentPlayer?.name || ""}
        />
      </CardContent>
    </Card>
  {:else if $gameState.gamePhase === "playing"}
    <!-- Waiting for Question -->
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-2xl">{player.currentPlayer?.name}</CardTitle>
      </CardHeader>
      <CardContent class="text-center space-y-4">
        <PlayerStats
          name={player.currentPlayer?.name || ""}
          score={player.currentPlayer?.score ?? 0}
          rank={player.playerRank}
          totalPlayers={$gameState.players.length}
        />
        <p class="text-muted-foreground">Waiting for host to select a question...</p>
        
        <RenameModal
          value={player.currentPlayer?.name || ""}
        />
      </CardContent>
    </Card>
  {:else if $gameState.gamePhase === "question"}
    <!-- Buzzer Screen -->
    <div class="w-full max-w-md">
      <Card class="mb-4">
        <CardHeader class="text-center pb-2">
          <CardTitle class="text-xl">{player.currentPlayer?.name}</CardTitle>
          <CardContent class="text-2xl font-bold text-purple-600">
            ${player.currentPlayer?.score ?? 0}
          </CardContent>
        </CardHeader>
      </Card>

      {#if $gameState.buzzerLocked}
        <Card class="bg-red-100 border-red-300">
          <CardContent class="p-8 text-center">
            <div class="text-6xl mb-4">🔒</div>
            <p class="text-xl font-semibold text-red-800">Buzzer locked</p>
            <p class="text-muted-foreground">Wait for the host to unlock...</p>
          </CardContent>
        </Card>
      {:else if player.hasBuzzedValue}
        <Card class="bg-yellow-100 border-yellow-300">
          <CardContent class="p-8 text-center">
            <div class="text-6xl mb-4">✋</div>
            <p class="text-xl font-semibold text-yellow-800">You buzzed!</p>
            <p class="text-2xl font-bold">Position: #{player.buzzPosition}</p>
          </CardContent>
        </Card>
      {:else}
        <BuzzerButton onBuzz={handleBuzz} />
      {/if}
    </div>
  {:else if $gameState.gamePhase === "leaderboard"}
    <!-- Leaderboard -->
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-3xl">🏆 Game over! 🏆</CardTitle>
      </CardHeader>
      <CardContent class="text-center space-y-4">
        {@const rank = player.playerRank}
        <div class="text-6xl">
          {#if rank === 1}🥇{:else if rank === 2}🥈{:else if rank === 3}🥉{:else}🎮{/if}
        </div>
        <p class="text-2xl font-semibold">{player.currentPlayer?.name}</p>
        <div class="bg-secondary p-4 rounded-lg">
          <p class="text-sm text-muted-foreground">Final Score</p>
          <p class="text-4xl font-bold text-purple-600">
            ${player.currentPlayer?.score ?? 0}
          </p>
        </div>
        <div class="bg-secondary p-4 rounded-lg">
          <p class="text-sm text-muted-foreground">Final Rank</p>
          <p class="text-2xl font-bold">
            #{rank} of {$gameState.players.length}
          </p>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>

<Toaster richColors position="top-right" />
