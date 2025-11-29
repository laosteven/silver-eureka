<script lang="ts">
  import PlayerManagement from "$lib/components/features/host/PlayerManagement.svelte";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import {
    initSocket,
    hostJoin,
    gameState,
    gameConfig,
    fullQuestion,
    connected,
  } from "$lib/stores/socket";
  import { useGame } from "$lib/composables/useGame.svelte";
  import { useQRCode } from "$lib/composables/useQRCode.svelte";
  import { useBuzzer } from "$lib/composables/useBuzzer.svelte";
  import { useMedia } from "$lib/composables/useMedia.svelte";
  import HostControls from "$lib/components/features/host/HostControls.svelte";
  import GameBoard from "$lib/components/features/game/GameBoard.svelte";
  import QuestionCard from "$lib/components/features/game/QuestionCard.svelte";
  import Leaderboard from "$lib/components/features/leaderboard/Leaderboard.svelte";

  const game = useGame();
  const qrCode = useQRCode();
  const buzzer = useBuzzer();
  const media = useMedia();

  let showResetConfirm = $state(false);
  let showPlayAgainConfirm = $state(false);

  onMount(() => {
    if (browser) {
      initSocket();
      hostJoin();
      qrCode.generate();
      buzzer.init();
      buzzer.setupAutoPlay();
    }
  });

  function handleResetGame() {
    showResetConfirm = true;
  }

  function confirmReset() {
    game.resetGame();
    showResetConfirm = false;
  }

  function cancelReset() {
    showResetConfirm = false;
  }

  function handlePlayAgain() {
    showPlayAgainConfirm = true;
  }

  function confirmPlayAgain() {
    game.startGame();
    showPlayAgainConfirm = false;
  }

  function cancelPlayAgain() {
    showPlayAgainConfirm = false;
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 p-4 flex flex-col">
  {#if !$connected}
    <div class="flex items-center justify-center flex-1">
      <Card class="p-8">
        <CardContent>
          <p class="text-xl">Connecting to server...</p>
        </CardContent>
      </Card>
    </div>
  {:else if $gameState.gamePhase === "lobby"}
    <!-- Lobby View -->
    <div class="flex items-center justify-center flex-1">
      <div class="max-w-6xl w-full">
        <Card class="mb-6">
          <CardHeader class="text-center">
            <CardTitle
              class="text-4xl font-bold text-blue-600 flex items-center justify-center gap-4"
              >{$gameConfig.title}
              <Button variant="ghost" size="sm" onclick={() => game.reloadConfig()}></Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid md:grid-cols-2 gap-6">
              <div class="text-center">
                <h3 class="text-xl font-semibold mb-4">Scan to join</h3>
                {#if qrCode.qrCodeDataUrl}
                  <img src={qrCode.qrCodeDataUrl} alt="QR Code to join game" class="mx-auto mb-2" />
                {/if}
                <p class="text-sm text-muted-foreground break-all">
                  {qrCode.joinUrl}
                </p>
              </div>
              <div>
                <h3 class="text-xl font-semibold mb-4">
                  Players ({$gameState.players.length})
                </h3>
                <div class="space-y-2 max-h-64 overflow-y-auto">
                  {#each $gameState.players as player}
                    <div class="p-2 bg-secondary rounded-lg flex items-center justify-between">
                      <span>{player.name}</span>
                      {#if !player.connected}
                        <span class="text-xs text-red-600 font-semibold">Disconnected</span>
                      {/if}
                    </div>
                  {/each}
                  {#if $gameState.players.length === 0}
                    <p class="text-muted-foreground">Waiting for players to join...</p>
                  {/if}
                </div>
              </div>
            </div>
            <div class="mt-6 text-center">
              <Button
                onclick={() => game.startGame()}
                disabled={$gameState.players.length === 0}
                class="px-8 py-4 text-xl"
              >
                Start game
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  {:else if $gameState.gamePhase === "playing"}
    <!-- Game Board View -->
    <div class="flex items-center justify-center flex-1">
      <div class="max-w-7xl w-full">
        <HostControls
          title={$gameConfig.title}
          canStart={$gameState.players.length > 0}
          onStart={() => game.startGame()}
          onShowLeaderboard={() => game.showLeaderboard()}
          onReset={handleResetGame}
        />

        <!-- Game Board -->
        <GameBoard
          categories={$gameConfig.categories}
          isAnswered={(cat, value) => game.isQuestionAnswered(cat, value)}
          onSelect={(cat, value) => game.selectQuestion(cat, value)}
        />

        <!-- Player Management -->
        <div class="mt-6">
          <PlayerManagement players={$gameState.players} />
        </div>
      </div>
    </div>
  {:else if $gameState.gamePhase === "question"}
    <!-- Question View -->
    <div class="flex items-center justify-center flex-1">
      <div class="max-w-4xl w-full">
        <QuestionCard
          question={$fullQuestion}
          showAnswer={$gameState.showAnswer}
          reveal={() => game.revealAnswer()}
          isVideo={media.isVideo}
          toVideoUrl={media.toVideoUrl}
          getYoutubeEmbedUrl={media.getYoutubeEmbedUrl}
          buzzerLocked={$gameState.buzzerLocked}
          onCancel={() => game.cancelQuestion()}
          onLock={() => game.lockBuzzer()}
          onUnlock={() => game.unlockBuzzer()}
          onClear={() => game.clearBuzzers()}
          onSkip={() => game.skipQuestion()}
        />

        <Card class="mt-6">
          <CardHeader>
            <CardTitle class="text-center text-2xl font-bold">
              Buzz order ({$gameState.buzzerLocked ? "LOCKED" : "OPEN"})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              {#if $gameState.buzzerOrder.length === 0}
                <p class="text-muted-foreground">No one has buzzed yet...</p>
              {:else}
                <div class="space-y-2">
                  {#each $gameState.buzzerOrder as buzz, index}
                    <div
                      class="p-3 rounded-lg flex items-center justify-between {index === 0
                        ? 'bg-yellow-100 border-2 border-yellow-400'
                        : 'bg-secondary'}"
                    >
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-lg">#{index + 1}</span>
                        <span class="font-semibold">{buzz.playerName}</span>
                      </div>
                      <div class="flex gap-2 items-center">
                        {#if index === 0}
                          <Button
                            onclick={() => game.markCorrect(buzz.playerId)}
                            variant="default"
                            size="sm">Correct</Button
                          >
                          <Button
                            onclick={() => game.markIncorrect(buzz.playerId)}
                            variant="destructive"
                            size="sm">Incorrect</Button
                          >
                        {/if}
                        <Button
                          onclick={() => game.removeBuzz(buzz.playerId)}
                          variant="outline"
                          size="sm"
                          class="text-xs">Remove</Button
                        >
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  {:else if $gameState.gamePhase === "leaderboard"}
    <!-- Leaderboard View -->
    <div class="flex items-center justify-center flex-1">
      <div class="max-w-2xl w-full">
        <Card>
          <CardHeader>
            <CardTitle class="text-center text-4xl font-bold">🏆 Leaderboard 🏆</CardTitle>
          </CardHeader>
          <CardContent>
            <Leaderboard players={game.getLeaderboard()} />
            <div class="mt-8 flex justify-center gap-4">
              <Button onclick={() => game.backToGame()} variant="outline">Back to game</Button>
              <Button onclick={handlePlayAgain} variant="default" class="px-8">Play again</Button>
              <Button onclick={handleResetGame} variant="secondary">Back to lobby</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  {/if}

  <!-- Reset Confirmation Modal -->
  {#if showResetConfirm}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card class="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle class="text-center">Reset game?</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <p class="text-center text-muted-foreground">
            Are you sure you want to reset the game? All scores will be lost and players will return
            to the lobby.
          </p>
          <div class="flex justify-center gap-4">
            <Button onclick={cancelReset} variant="outline">Cancel</Button>
            <Button onclick={confirmReset} variant="destructive">Reset game</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  {/if}

  <!-- Play Again Confirmation Modal -->
  {#if showPlayAgainConfirm}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card class="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle class="text-center">Play again?</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <p class="text-center text-muted-foreground">
            This will reset all scores to 0 and start a new game with the same players.
          </p>
          <div class="flex justify-center gap-4">
            <Button onclick={cancelPlayAgain} variant="outline">Cancel</Button>
            <Button onclick={confirmPlayAgain} variant="default">Play again</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  {/if}
</div>
