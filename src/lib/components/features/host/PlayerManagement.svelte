<script lang="ts">
  import { Card, CardHeader, CardTitle, CardContent } from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import { Button } from "$lib/components/ui/button";
  import { hostUpdatePlayerName, updatePlayerScore } from "$lib/stores/socket";
  import type { Player } from "$lib/types";
  import { validateScore } from "$lib/utils/validation";

  const p = $props<{ players: Player[] }>();
  let editingNames = $state<Record<string, string>>({});
  let renameErrors = $state<Record<string, string | null>>({});
  let editingScores = $state<Record<string, number>>({});
  let scoreErrors = $state<Record<string, string | null>>({});
  let editingId = $state<string | null>(null);

  $effect(() => {
    const nextNames: Record<string, string> = {};
    const nextScores: Record<string, number> = {};
    for (const player of p.players) {
      nextNames[player.id] = player.name;
      nextScores[player.id] = player.score;
    }
    editingNames = nextNames;
    editingScores = nextScores;
  });

  async function saveChanges(player: Player) {
    const newName = (editingNames[player.id] || "").trim();
    const newScore = Number(editingScores[player.id]);

    let ok = true;

    // Validate name (allow unchanged empty to be flagged)
    if (!newName) {
      renameErrors[player.id] = "Name cannot be empty";
      ok = false;
    } else {
      renameErrors[player.id] = null;
    }

    // Validate score
    const { valid, error } = validateScore(newScore);
    if (!valid) {
      scoreErrors[player.id] = error ?? "Invalid score";
      ok = false;
    } else {
      scoreErrors[player.id] = null;
    }

    if (!ok) return;

    // Apply changes only if they differ
    if (newName !== player.name) {
      const result = await hostUpdatePlayerName(player.id, newName);
      renameErrors[player.id] = result.success ? null : result.error || "Failed to rename";
      if (!result.success) return; // stop if rename failed
    }

    if (newScore !== player.score) {
      await updatePlayerScore(player.id, newScore);
    }

    editingId = null;
  }
</script>

<div>
  <h1 class="text-2xl font-bold text-white my-4">Players</h1>
  <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
    {#each p.players as player}
      <button class="text-left" onclick={() => (editingId = player.id)}>
        <Card
          class="text-center hover:bg-accent transition-colors cursor-pointer {!player.connected
            ? 'opacity-60'
            : ''}"
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

  {#if editingId}
    <div
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onclick={() => (editingId = null)}
      onkeydown={(e) => (e.key === "Escape" || e.key === "Enter") && (editingId = null)}
      role="button"
      tabindex="0"
    >
      <div
        class="w-full max-w-md"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        tabindex="0"
      >
        {#each p.players as player}
          {#if player.id === editingId}
            {@const inputId = `host-edit-name-${player.id}`}
            {@const scoreId = `host-edit-score-${player.id}`}
            <Card class="w-full">
              <CardHeader>
                <CardTitle>Edit player</CardTitle>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="space-y-2">
                  <label for={inputId} class="text-sm text-muted-foreground">Username</label>
                  <Input
                    id={inputId}
                    type="text"
                    bind:value={editingNames[player.id]}
                    class="w-full"
                  />
                </div>
                {#if renameErrors[player.id]}
                  <div
                    class="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm"
                  >
                    {renameErrors[player.id]}
                  </div>
                {/if}

                <div class="space-y-2">
                  <label for={scoreId} class="text-sm text-muted-foreground">Score</label>
                  <Input
                    id={scoreId}
                    type="number"
                    bind:value={editingScores[player.id]}
                    class="w-full"
                  />
                </div>
                {#if scoreErrors[player.id]}
                  <div
                    class="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm"
                  >
                    {scoreErrors[player.id]}
                  </div>
                {/if}

                <div class="flex items-center justify-between gap-2 mt-2">
                  <Button variant="outline" onclick={() => (editingId = null)} class="flex-1"
                    >Close</Button
                  >
                  <Button onclick={() => saveChanges(player)} class="flex-1">Save</Button>
                </div>
              </CardContent>
            </Card>
          {/if}
        {/each}
      </div>
    </div>
  {/if}
</div>
