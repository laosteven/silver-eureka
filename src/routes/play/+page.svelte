<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { Button } from "$lib/components/ui/button";
  import { Toaster, toast } from "svelte-sonner";
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
  } from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import {
    initSocket,
    playerJoin,
    gameState,
    gameConfig,
    playerId,
    buzz,
    connected,
    joinError,
    playerRename,
    hostNotification,
  } from "$lib/stores/socket";

  let username = $state("");
  let hasJoined = $state(false);
  let buzzed = $state(false);
  let showRenameModal = $state(false);
  let newUsername = $state("");
  let renameError = $state<string | null>(null);

  const STORAGE_KEY = "jeopardy-game_username";

  onMount(() => {
    if (browser) {
      initSocket();

      // Check for saved username for session restoration
      const savedUsername = localStorage.getItem(STORAGE_KEY);
      if (savedUsername) {
        username = savedUsername;
      }
    }
  });

  async function handleJoin() {
    if (username.trim()) {
      joinError.set(null);
      const result = await playerJoin(username.trim());
      if (result.success) {
        // Save username to localStorage for session restoration
        localStorage.setItem(STORAGE_KEY, username.trim());
        hasJoined = true;
      }
      // Error is already set in the store by playerJoin
    }
  }

  async function handleRename() {
    if (newUsername.trim()) {
      renameError = null;
      const result = await playerRename(newUsername.trim());
      if (result.success) {
        username = newUsername.trim();
        localStorage.setItem(STORAGE_KEY, newUsername.trim());
        showRenameModal = false;
        newUsername = "";
      } else {
        renameError = result.error || "Failed to rename";
      }
    }
  }

  function openRenameModal() {
    newUsername = username;
    renameError = null;
    showRenameModal = true;
  }

  function closeRenameModal() {
    showRenameModal = false;
    newUsername = "";
    renameError = null;
  }

  // Clear error when username changes
  $effect(() => {
    if (username) {
      joinError.set(null);
    }
  });

  function handleBuzz() {
    buzz();
    buzzed = true;
  }

  function getCurrentPlayer() {
    return $gameState.players.find((p) => p.id === $playerId);
  }

  function getPlayerRank() {
    const sorted = [...$gameState.players].sort((a, b) => b.score - a.score);
    const index = sorted.findIndex((p) => p.id === $playerId);
    return index + 1;
  }

  function hasBuzzed() {
    return $gameState.buzzerOrder.some((b) => b.playerId === $playerId);
  }

  function getBuzzPosition() {
    const index = $gameState.buzzerOrder.findIndex(
      (b) => b.playerId === $playerId
    );
    return index + 1;
  }

  // Reset buzzed state when question changes or phase changes
  $effect(() => {
    if ($gameState.gamePhase !== "question") {
      buzzed = false;
    }
  });

  // Show toast notification when host updates something
  $effect(() => {
    if ($hostNotification) {
      toast.info($hostNotification.message);
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
  {:else if !hasJoined}
    <!-- Username Entry -->
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-3xl font-bold text-purple-600"
          >{$gameConfig.title}</CardTitle
        >
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
            bind:value={username}
            maxlength={20}
            class="text-lg py-6"
          />
          {#if $joinError}
            <div
              class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
            >
              <p class="text-sm font-semibold">{$joinError}</p>
            </div>
          {/if}
          <Button
            type="submit"
            class="w-full text-lg py-6"
            disabled={!username.trim()}
          >
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
          Welcome, {getCurrentPlayer()?.name}!
        </p>
        <p class="text-muted-foreground">
          {$gameState.players.length} player(s) joined
        </p>
        <Button onclick={openRenameModal} variant="outline" class="mt-4">
          Change name
        </Button>
      </CardContent>
    </Card>
  {:else if $gameState.gamePhase === "playing"}
    <!-- Waiting for Question -->
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-2xl">{getCurrentPlayer()?.name}</CardTitle>
      </CardHeader>
      <CardContent class="text-center space-y-4">
        <div class="text-6xl">🎯</div>
        <div class="bg-secondary p-4 rounded-lg">
          <p class="text-sm text-muted-foreground">Your score</p>
          <p class="text-4xl font-bold text-purple-600">
            ${getCurrentPlayer()?.score ?? 0}
          </p>
        </div>
        <div class="bg-secondary p-4 rounded-lg">
          <p class="text-sm text-muted-foreground">Your rank</p>
          <p class="text-2xl font-bold">
            #{getPlayerRank()} of {$gameState.players.length}
          </p>
        </div>
        <p class="text-muted-foreground">
          Waiting for host to select a question...
        </p>
        <Button onclick={openRenameModal} variant="outline" size="sm">
          Change name
        </Button>
      </CardContent>
    </Card>
  {:else if $gameState.gamePhase === "question"}
    <!-- Buzzer Screen -->
    <div class="w-full max-w-md">
      <Card class="mb-4">
        <CardHeader class="text-center pb-2">
          <CardTitle class="text-xl">{getCurrentPlayer()?.name}</CardTitle>
          <CardContent class="text-2xl font-bold text-purple-600">
            ${getCurrentPlayer()?.score ?? 0}
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
      {:else if hasBuzzed()}
        <Card class="bg-yellow-100 border-yellow-300">
          <CardContent class="p-8 text-center">
            <div class="text-6xl mb-4">✋</div>
            <p class="text-xl font-semibold text-yellow-800">You buzzed!</p>
            <p class="text-2xl font-bold">Position: #{getBuzzPosition()}</p>
          </CardContent>
        </Card>
      {:else}
        <button
          onclick={handleBuzz}
          class="w-full aspect-square bg-red-600 hover:bg-red-500 active:bg-red-700 active:scale-95 rounded-xl shadow-2xl transition-all flex items-center justify-center"
        >
          <span class="text-white text-4xl font-bold">BUZZ!</span>
        </button>
      {/if}
    </div>
  {:else if $gameState.gamePhase === "leaderboard"}
    <!-- Leaderboard -->
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-3xl">🏆 Game over! 🏆</CardTitle>
      </CardHeader>
      <CardContent class="text-center space-y-4">
        {@const rank = getPlayerRank()}
        <div class="text-6xl">
          {#if rank === 1}🥇{:else if rank === 2}🥈{:else if rank === 3}🥉{:else}🎮{/if}
        </div>
        <p class="text-2xl font-semibold">{getCurrentPlayer()?.name}</p>
        <div class="bg-secondary p-4 rounded-lg">
          <p class="text-sm text-muted-foreground">Final Score</p>
          <p class="text-4xl font-bold text-purple-600">
            ${getCurrentPlayer()?.score ?? 0}
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

  <!-- Rename Modal -->
  {#if showRenameModal}
    <div
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onclick={closeRenameModal}
      onkeydown={(e) => e.key === "Escape" && closeRenameModal()}
      role="button"
      tabindex="-1"
    >
      <div
        class="w-full max-w-md"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        tabindex="0"
      >
        <Card class="w-full">
          <CardHeader>
            <CardTitle>Change your name</CardTitle>
            <CardDescription>Enter a new username</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onsubmit={(e) => {
                e.preventDefault();
                handleRename();
              }}
              class="space-y-4"
            >
              <div
                class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4"
              >
                <p class="text-sm text-yellow-800">
                  <strong>⚠️ Important:</strong> To keep your current score, use
                  the same name when you rejoin. Changing to a different name will
                  restore any previous score associated with that name.
                </p>
              </div>
              <Input
                type="text"
                placeholder="New name"
                bind:value={newUsername}
                maxlength={20}
                class="text-lg py-6"
              />
              {#if renameError}
                <div
                  class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
                >
                  <p class="text-sm font-semibold">{renameError}</p>
                </div>
              {/if}
              <div class="flex gap-2">
                <Button
                  type="button"
                  onclick={closeRenameModal}
                  variant="outline"
                  class="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  class="flex-1"
                  disabled={!newUsername.trim()}
                >
                  Change name
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  {/if}
</div>

<Toaster richColors position="top-right" />
