<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { Button } from "$lib/components/ui/button";
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import {
    initSocket,
    hostJoin,
    gameState,
    gameConfig,
    fullQuestion,
    startGame,
    selectQuestion,
    correctAnswer,
    incorrectAnswer,
    skipQuestion,
    showLeaderboard,
    backToGame,
    resetGame,
    lockBuzzer,
    unlockBuzzer,
    clearBuzzers,
    revealAnswer,
    cancelQuestion,
    updatePlayerScore,
    hostUpdatePlayerName,
    connected,
    buzzerSound,
    reloadConfig,
  } from "$lib/stores/socket";
  import QRCode from "qrcode";
  import CardDescription from "$lib/components/ui/card/card-description.svelte";

  let qrCodeDataUrl = $state("");
  let joinUrl = $state("");
  let showResetConfirm = $state(false);
  let showPlayAgainConfirm = $state(false);
  let editingPlayer: { id: string; name: string; score: number } | null =
    $state(null);
  let editScoreValue = $state("");
  let editNameValue = $state("");
  let editError = $state<string | null>(null);
  let buzzerAudio: HTMLAudioElement | null = $state(null);

  onMount(() => {
    if (browser) {
      initSocket();
      hostJoin();

      // Generate QR code for join URL
      joinUrl = `${window.location.origin}/play`;
      QRCode.toDataURL(joinUrl, { width: 200 })
        .then((url: string) => {
          qrCodeDataUrl = url;
        })
        .catch(console.error);

      // Create buzzer audio element with a proper beep sound
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const buffer = audioContext.createBuffer(
        1,
        audioContext.sampleRate * 0.2,
        audioContext.sampleRate
      );
      const data = buffer.getChannelData(0);

      // Generate a beep sound (440 Hz for 0.2 seconds)
      for (let i = 0; i < data.length; i++) {
        const t = i / audioContext.sampleRate;
        data[i] = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t * 5);
      }

      buzzerAudio = {
        play: () => {
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.destination);
          source.start();
          return Promise.resolve();
        },
        currentTime: 0,
      } as any;
    }
  });

  // Play buzzer sound when someone buzzes
  $effect(() => {
    if ($buzzerSound && buzzerAudio) {
      buzzerAudio.currentTime = 0;
      buzzerAudio.play().catch(() => {});
    }
  });

  function isQuestionAnswered(categoryName: string, value: number): boolean {
    return $gameState.answeredQuestions.includes(`${categoryName}-${value}`);
  }

  function handleSelectQuestion(categoryName: string, value: number) {
    if (!isQuestionAnswered(categoryName, value)) {
      selectQuestion(categoryName, value);
    }
  }

  function getLeaderboard() {
    return [...$gameState.players].sort((a, b) => b.score - a.score);
  }

  function handleResetGame() {
    showResetConfirm = true;
  }

  function confirmReset() {
    resetGame();
    showResetConfirm = false;
  }

  function cancelReset() {
    showResetConfirm = false;
  }

  function handlePlayAgain() {
    showPlayAgainConfirm = true;
  }

  function confirmPlayAgain() {
    startGame();
    showPlayAgainConfirm = false;
  }

  function cancelPlayAgain() {
    showPlayAgainConfirm = false;
  }

  function openScoreEditor(player: {
    id: string;
    name: string;
    score: number;
  }) {
    editingPlayer = player;
    editScoreValue = player.score.toString();
    editNameValue = player.name;
    editError = null;
  }

  async function saveScore() {
    if (editingPlayer) {
      // Update name if changed
      if (editNameValue.trim() && editNameValue.trim() !== editingPlayer.name) {
        const nameResult = await hostUpdatePlayerName(
          editingPlayer.id,
          editNameValue.trim()
        );
        if (!nameResult.success) {
          editError = nameResult.error || "Failed to update name";
          return;
        }
      }

      // Update score if changed
      const newScore = parseInt(editScoreValue, 10);
      if (!isNaN(newScore) && newScore !== editingPlayer.score) {
        updatePlayerScore(editingPlayer.id, newScore);
      }
    }
    closeScoreEditor();
  }

  function closeScoreEditor() {
    editingPlayer = null;
    editScoreValue = "";
    editNameValue = "";
    editError = null;
  }

  function getYoutubeEmbedUrl(url: string): string {
    const videoId = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/
    )?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  function isVideo(url: string): boolean {
    return /\.(mp4|webm|ogg|gifv)(?:\?.*)?$/i.test(url);
  }

  function toVideoUrl(url: string): string {
    // Imgur gifv -> mp4
    if (/\.gifv$/i.test(url)) {
      return url.replace(/\.gifv$/i, ".mp4");
    }
    // Imgur page URL (e.g., https://imgur.com/abc123) -> direct mp4
    const imgurMatch = url.match(/^https?:\/\/imgur\.com\/([A-Za-z0-9]+)$/);
    if (imgurMatch) {
      return `https://i.imgur.com/${imgurMatch[1]}.mp4`;
    }
    return url;
  }
</script>

<div
  class="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 p-4 flex flex-col"
>
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
              <Button variant="ghost" size="sm" onclick={() => reloadConfig()}
              ></Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid md:grid-cols-2 gap-6">
              <div class="text-center">
                <h3 class="text-xl font-semibold mb-4">Scan to join</h3>
                {#if qrCodeDataUrl}
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code to join game"
                    class="mx-auto mb-2"
                  />
                {/if}
                <p class="text-sm text-muted-foreground break-all">{joinUrl}</p>
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
                    <p class="text-muted-foreground">
                      Waiting for players to join...
                    </p>
                  {/if}
                </div>
              </div>
            </div>
            <div class="mt-6 text-center">
              <Button
                onclick={() => startGame()}
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
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-3xl font-bold text-white">{$gameConfig.title}</h1>
          <div class="space-x-2">
            <Button onclick={() => showLeaderboard()} variant="secondary"
              >Show leaderboard</Button
            >
            <Button onclick={handleResetGame} variant="destructive"
              >Reset game</Button
            >
          </div>
        </div>

        <!-- Game Board -->
        <div
          class="grid gap-2"
          style="grid-template-columns: repeat({$gameConfig.categories
            .length}, 1fr)"
        >
          <!-- Category Headers -->
          {#each $gameConfig.categories as category}
            <div
              class="bg-blue-800 text-white p-4 text-center font-bold text-lg rounded-t"
            >
              {category.name}
            </div>
          {/each}

          <!-- Question Values -->
          {#each Array.from(new Set($gameConfig.categories.flatMap( (c) => c.questions.map((q) => q.value) ))).sort((a, b) => a - b) as value}
            {#each $gameConfig.categories as category}
              {@const isAnswered = isQuestionAnswered(category.name, value)}
              <button
                onclick={() => handleSelectQuestion(category.name, value)}
                disabled={isAnswered}
                class="bg-blue-700 text-yellow-300 p-4 text-2xl font-bold hover:bg-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isAnswered ? "" : `$${value}`}
              </button>
            {/each}
          {/each}
        </div>

        <!-- Player Scores -->
        <div class="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {#each $gameState.players as player}
            <button onclick={() => openScoreEditor(player)} class="text-left">
              <Card
                class="text-center hover:bg-accent transition-colors cursor-pointer {!player.connected ? 'opacity-60' : ''}"
              >
                <CardContent class="p-3">
                  <div class="flex items-center justify-center gap-1">
                    <p class="font-semibold truncate">{player.name}</p>
                    {#if !player.connected}
                      <span class="text-xs text-red-600">⚠️</span>
                    {/if}
                  </div>
                  <p class="text-xl font-bold text-blue-600">${player.score}</p>
                </CardContent>
              </Card>
            </button>
          {/each}
        </div>
      </div>
    </div>
  {:else if $gameState.gamePhase === "question"}
    <!-- Question View -->
    <div class="flex items-center justify-center flex-1">
      <div class="max-w-4xl w-full">
        <Card>
          <CardHeader>
            <CardTitle class="text-center text-2xl">
              {$fullQuestion?.category} - ${$fullQuestion?.value}
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="bg-blue-900 text-white p-8 rounded-lg text-center">
              <p class="text-2xl">{$fullQuestion?.question}</p>

              {#if $fullQuestion?.image}
                {#if isVideo($fullQuestion.image)}
                  <video
                    src={toVideoUrl($fullQuestion.image)}
                    autoplay
                    loop
                    playsinline
                    controls
                    class="mx-auto mt-4 max-h-64 rounded-lg"
                  >
                    <track kind="captions" label="Video" default />
                  </video>
                {:else}
                  <img
                    src={$fullQuestion.image}
                    alt=""
                    class="mx-auto mt-4 max-h-64 rounded-lg"
                  />
                {/if}
              {/if}

              {#if $fullQuestion?.youtube}
                <div class="mt-4 aspect-video">
                  <iframe
                    src={getYoutubeEmbedUrl($fullQuestion.youtube)}
                    title="Question video"
                    class="w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                  ></iframe>
                </div>
              {/if}
            </div>

            {#if $gameState.showAnswer}
              <div class="bg-green-100 p-4 rounded-lg">
                <p class="text-sm text-muted-foreground mb-1">Answer:</p>
                <p class="text-xl font-semibold text-green-800">
                  {$fullQuestion?.answer}
                </p>
              </div>
            {:else}
              <div class="text-center">
                <Button
                  onclick={() => revealAnswer()}
                  variant="outline"
                  class="px-8"
                >
                  Reveal answer
                </Button>
              </div>
            {/if}

            <!-- Buzzer Controls -->
            <div class="flex justify-center gap-4 flex-wrap">
              <Button onclick={() => cancelQuestion()} variant="ghost">
                Cancel question
              </Button>
              {#if !$gameState.buzzerLocked}
                <Button onclick={() => lockBuzzer()} variant="outline">
                  Lock buzzers
                </Button>
              {:else}
                <Button onclick={() => unlockBuzzer()} variant="outline">
                  Unlock buzzers
                </Button>
              {/if}
              <Button onclick={() => clearBuzzers()} variant="outline">
                Clear queue
              </Button>
              <Button onclick={() => skipQuestion()} variant="destructive">
                Skip question
              </Button>
            </div>

            <!-- Buzz Order -->
            <div>
              <h3 class="font-semibold mb-2">
                Buzz order ({$gameState.buzzerLocked ? "LOCKED" : "OPEN"})
              </h3>
              {#if $gameState.buzzerOrder.length === 0}
                <p class="text-muted-foreground">No one has buzzed yet...</p>
              {:else}
                <div class="space-y-2">
                  {#each $gameState.buzzerOrder as buzz, index}
                    <div
                      class="flex items-center justify-between p-3 rounded-lg {index ===
                      0
                        ? 'bg-yellow-100 border-2 border-yellow-400'
                        : 'bg-secondary'}"
                    >
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-lg">#{index + 1}</span>
                        <span class="font-semibold">{buzz.playerName}</span>
                      </div>
                      {#if index === 0}
                        <div class="flex gap-2">
                          <Button
                            onclick={() => correctAnswer(buzz.playerId)}
                            variant="default"
                            size="sm"
                          >
                            Correct
                          </Button>
                          <Button
                            onclick={() => incorrectAnswer(buzz.playerId)}
                            variant="destructive"
                            size="sm"
                          >
                            Incorrect
                          </Button>
                        </div>
                      {/if}
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
            <CardTitle class="text-center text-4xl font-bold"
              >🏆 Leaderboard 🏆</CardTitle
            >
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              {#each getLeaderboard() as player, index}
                <div
                  class="flex items-center justify-between p-4 rounded-lg {index ===
                  0
                    ? 'bg-yellow-100'
                    : index === 1
                      ? 'bg-gray-100'
                      : index === 2
                        ? 'bg-orange-100'
                        : 'bg-secondary'} {!player.connected ? 'opacity-60' : ''}"
                >
                  <div class="flex items-center gap-4">
                    <span class="text-3xl">
                      {#if index === 0}🥇{:else if index === 1}🥈{:else if index === 2}🥉{:else}{index +
                          1}{/if}
                    </span>
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-xl">{player.name}</span>
                      {#if !player.connected}
                        <span class="text-xs text-red-600 font-semibold">⚠️ Disconnected</span>
                      {/if}
                    </div>
                  </div>
                  <span class="text-2xl font-bold text-blue-600"
                    >${player.score}</span
                  >
                </div>
              {/each}
            </div>
            <div class="mt-8 flex justify-center gap-4">
              <Button
                onclick={() => backToGame()}
                variant="outline"
                class="px-8"
              >
                Back to game
              </Button>
              <Button onclick={handlePlayAgain} variant="default" class="px-8">
                Play again
              </Button>
              <Button onclick={handleResetGame} variant="secondary">
                Back to lobby
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  {/if}

  <!-- Reset Confirmation Modal -->
  {#if showResetConfirm}
    <div
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <Card class="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle class="text-center">Reset game?</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <p class="text-center text-muted-foreground">
            Are you sure you want to reset the game? All scores will be lost and
            players will return to the lobby.
          </p>
          <div class="flex justify-center gap-4">
            <Button onclick={cancelReset} variant="outline">Cancel</Button>
            <Button onclick={confirmReset} variant="destructive"
              >Reset game</Button
            >
          </div>
        </CardContent>
      </Card>
    </div>
  {/if}

  <!-- Play Again Confirmation Modal -->
  {#if showPlayAgainConfirm}
    <div
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <Card class="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle class="text-center">Play again?</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <p class="text-center text-muted-foreground">
            This will reset all scores to 0 and start a new game with the same
            players.
          </p>
          <div class="flex justify-center gap-4">
            <Button onclick={cancelPlayAgain} variant="outline">Cancel</Button>
            <Button onclick={confirmPlayAgain} variant="default"
              >Play again</Button
            >
          </div>
        </CardContent>
      </Card>
    </div>
  {/if}

  <!-- Score Editor Modal -->
  {#if editingPlayer}
    <div
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <Card class="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Edit score</CardTitle>
          <CardDescription
            >Modify the score for the selected player below</CardDescription
          >
        </CardHeader>
        <CardContent class="space-y-4">
          <form
            onsubmit={(e) => {
              e.preventDefault();
              saveScore();
            }}
            class="space-y-4"
          >
            <div>
              <label for="name-input" class="block text-sm font-medium mb-2"
                >Player name</label
              >
              <input
                id="name-input"
                type="text"
                bind:value={editNameValue}
                maxlength="20"
                class="w-full px-4 py-2 text-lg border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label for="score-input" class="block text-sm font-medium mb-2"
                >Score</label
              >
              <input
                id="score-input"
                type="number"
                bind:value={editScoreValue}
                class="w-full px-4 py-2 text-lg border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {#if editError}
              <div
                class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
              >
                <p class="text-sm font-semibold">{editError}</p>
              </div>
            {/if}
            <div class="flex gap-2">
              <Button
                type="button"
                onclick={closeScoreEditor}
                variant="outline"
                class="flex-1">Cancel</Button
              >
              <Button
                type="submit"
                variant="default"
                disabled={!editNameValue.trim()}
                class="flex-1">Save</Button
              >
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  {/if}
</div>
