<script lang="ts">
  import { browser } from "$app/environment";
  import GameBoard from "$lib/components/features/game/GameBoard.svelte";
  import QuestionCard from "$lib/components/features/game/QuestionCard.svelte";
  import HostControls from "$lib/components/features/host/HostControls.svelte";
  import HostEndGameDialog from "$lib/components/features/host/HostEndGameDialog.svelte";
  import HostRemoveAllPlayersDialog from "$lib/components/features/host/HostRemoveAllPlayersDialog.svelte";
  import HostRemoveDisconnectedDialog from "$lib/components/features/host/HostRemoveDisconnectedDialog.svelte";
  import ChartPhase from "$lib/components/features/leaderboard/ChartPhase.svelte";
  import Leaderboard from "$lib/components/features/leaderboard/Leaderboard.svelte";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "$lib/components/ui/dropdown-menu";
  import { Label } from "$lib/components/ui/label";
  import ScrollArea from "$lib/components/ui/scroll-area/scroll-area.svelte";
  import Switch from "$lib/components/ui/switch/switch.svelte";
  import { useBuzzer } from "$lib/composables/useBuzzer.svelte";
  import { useGame } from "$lib/composables/useGame.svelte";
  import { useMedia } from "$lib/composables/useMedia.svelte";
  import { useQRCode } from "$lib/composables/useQRCode.svelte";
  import {
    connected,
    fullQuestion,
    gameConfig,
    gameState,
    hostEmojiReaction,
    hostJoin,
    hostLeave,
    initSocket,
  } from "$lib/stores/socket";
  import { celebrateCorrect, celebrateLeaderboard } from "$lib/utils/confetti";
  import Check from "@lucide/svelte/icons/check";
  import LockKeyhole from "@lucide/svelte/icons/lock-keyhole";
  import MoreHorizontal from "@lucide/svelte/icons/more-horizontal";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import X from "@lucide/svelte/icons/x";
  import { onMount } from "svelte";
  import { toast, Toaster } from "svelte-sonner";

  const game = useGame();
  const qrCode = useQRCode();
  const buzzer = useBuzzer();
  const media = useMedia();

  let editingPlayerId = $state<string | null>(null);
  let editingName = $state("");
  let editError = $state("");

  onMount(() => {
    if (browser) {
      initSocket();
      hostJoin();
      qrCode.generate();
      buzzer.init();
      buzzer.setupAutoPlay();
    }
    return () => {
      if (browser) hostLeave();
    };
  });

  function startEditingName(playerId: string, currentName: string) {
    editingPlayerId = playerId;
    editingName = currentName;
    editError = "";
  }

  function cancelEditName() {
    editingPlayerId = null;
    editingName = "";
    editError = "";
  }

  async function saveEditName() {
    if (!editingPlayerId) return;

    const result = await game.updatePlayerName(editingPlayerId, editingName);
    if (result.success) {
      editingPlayerId = null;
      editingName = "";
      editError = "";
    } else {
      editError = result.error || "Failed to update name";
    }
  }

  $effect(() => {
    if ($gameState.gamePhase === "leaderboard") {
      if (typeof window !== "undefined") {
        celebrateLeaderboard().catch(() => {});
      }
    }
  });

  $effect(() => {
    if ($hostEmojiReaction) {
      toast.info(`${$hostEmojiReaction.playerName} sent ${$hostEmojiReaction.emoji}`, {
        dismissable: true,
      });
    }
  });
</script>

<div
  class="min-h-screen bg-blue-950 dark:bg-slate-950 text-slate-100 font-sans selection:bg-amber-500/30"
>
  <div
    class="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-12 relative overflow-hidden"
  >
    <div class="relative z-10 space-y-6 max-w-2xl w-full">
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
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div class="gap-6 md-2">
                  <div class="text-center">
                    <h3 class="text-xl font-semibold mb-4">Scan the QR code to join!</h3>
                    {#if qrCode.qrCodeDataUrl}
                      <img
                        src={qrCode.qrCodeDataUrl}
                        alt="QR Code to join game"
                        class="mx-auto mb-2"
                      />
                    {/if}
                    <p class="text-sm text-muted-foreground break-all">
                      {qrCode.joinUrl}
                    </p>
                  </div>
                  <div>
                    <div class="flex items-center gap-4 mb-4">
                      <h3 class="text-xl font-semibold mr-auto">
                        Players ({$gameState.players.length})
                      </h3>
                      {#if $gameState.players.length > 0}
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button size="icon" variant="outline" aria-label="More Options">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              {#snippet child({ props })}
                                <HostRemoveDisconnectedDialog {...props}>
                                  Remove disconnected
                                </HostRemoveDisconnectedDialog>
                              {/snippet}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              {#snippet child({ props })}
                                <HostRemoveAllPlayersDialog {...props}>
                                  Clear players
                                </HostRemoveAllPlayersDialog>
                              {/snippet}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      {/if}
                    </div>
                    <ScrollArea class="h-50 rounded-md border">
                      {#each $gameState.players as player}
                        <div
                          class="px-4 py-2 bg-secondary rounded-lg flex items-center justify-between m-2 m-4"
                        >
                          {#if editingPlayerId === player.id}
                            <div class="flex flex-col gap-1 flex-1">
                              <input
                                type="text"
                                bind:value={editingName}
                                class="px-2 py-1 rounded border bg-background"
                                placeholder="Player name"
                              />
                              {#if editError}
                                <span class="text-xs text-red-600">{editError}</span>
                              {/if}
                            </div>
                            <div class="flex items-center gap-2 ml-2">
                              <Button size="sm" onclick={saveEditName}>Save</Button>
                              <Button size="sm" variant="outline" onclick={cancelEditName}
                                >Cancel</Button
                              >
                            </div>
                          {:else}
                            <span>{player.name}</span>
                            {#if !player.connected}
                              <div class="flex items-center gap-2">
                                <span class="text-xs text-red-600 font-semibold">Disconnected</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  class="text-xs"
                                  onclick={() => game.removePlayer(player.id)}>❌</Button
                                >
                              </div>
                            {/if}
                            {#if player.connected}
                              <Button
                                variant="outline"
                                size="icon"
                                class="text-xs"
                                onclick={() => startEditingName(player.id, player.name)}>✏️</Button
                              >
                            {/if}
                          {/if}
                        </div>
                      {/each}
                      {#if $gameState.players.length === 0}
                        <p
                          class="text-muted-foreground my-auto h-full flex items-center justify-center"
                        >
                          Waiting for players to join...
                        </p>
                      {/if}
                    </ScrollArea>
                  </div>
                </div>
                <div class="flex mt-6 text-center gap-4 justify-center">
                  <Button
                    onclick={() => game.startGame()}
                    disabled={$gameState.players.length === 0}
                    class="px-8 py-4 text-xl"
                    size="lg"
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
            <HostControls title={$gameConfig.title} onRevealScoring={() => game.showScoring()} />

            <!-- Game Board -->
            <GameBoard
              categories={$gameConfig.categories}
              isAnswered={(cat, value) => game.isQuestionAnswered(cat, value)}
              onSelect={(cat, value) => game.selectQuestion(cat, value)}
            />
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
              onSkip={() => game.skipQuestion()}
            />

            <Card class="mt-6">
              <CardHeader>
                <CardTitle class="flex justify-between items-center">
                  <p class="text-xl mr-auto">Buzzer queue</p>
                  <div
                    class="flex items-center mr-2 border-input bg-background border shadow-sm h-8 rounded-md px-3 text-xs"
                  >
                    <Switch
                      id="buzzer-lock-switch"
                      checked={$gameState.buzzerLocked}
                      title="Toggle buzzer lock"
                      onCheckedChange={(checkedEvent) => {
                        if (checkedEvent) {
                          game.lockBuzzer();
                        } else {
                          game.unlockBuzzer();
                        }
                      }}
                    />
                    <Label for="buzzer-lock-switch" class="select-none ml-2">
                      <LockKeyhole size={16} />
                    </Label>
                  </div>
                  <Button
                    onclick={() => game.clearBuzzers()}
                    size="sm"
                    variant="outline"
                    title="Clear queue"
                    ><Trash2 /> Clear
                  </Button>
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
                                onclick={() => game.markIncorrect(buzz.playerId)}
                                variant="destructive"
                              >
                                <X /> Wrong
                              </Button>
                              <Button
                                onclick={() => {
                                  game.markCorrect(buzz.playerId);
                                  // celebrate for correct answer
                                  celebrateCorrect().catch(() => {});
                                }}
                                variant="default"
                                class="bg-green-600 hover:bg-green-700 text-white border-green-700"
                              >
                                <Check /> Correct
                              </Button>
                            {/if}
                            <Button
                              onclick={() => game.removeBuzz(buzz.playerId)}
                              variant="outline"
                              class="text-xs"
                            >
                              <Trash2 />
                            </Button>
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
      {:else if $gameState.gamePhase === "scoring"}
        <!-- Scoring View -->
        <div class="flex items-center justify-center flex-1">
          <div class="max-w-2xl w-full">
            <Card>
              <CardHeader>
                <CardTitle class="text-center text-4xl font-bold">Score</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartPhase players={game.getLeaderboard()} />
                <div class="mt-8 flex justify-center gap-4">
                  <Button onclick={() => game.backToGame()} variant="outline">Back to game</Button>
                  <Button onclick={() => game.showLeaderboard()} variant="default">
                    Leaderboard
                  </Button>
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
                  <HostEndGameDialog>
                    <Button>Back to lobby</Button>
                  </HostEndGameDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<Toaster richColors position="top-left" />
