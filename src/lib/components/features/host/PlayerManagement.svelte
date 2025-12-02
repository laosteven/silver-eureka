<script lang="ts">
  import { buttonVariants } from "$lib/components/ui/button";
  import { Card, CardContent } from "$lib/components/ui/card";
  import * as Drawer from "$lib/components/ui/drawer/index.js";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { hostUpdatePlayerName, updatePlayerScore } from "$lib/stores/socket";
  import type { Player } from "$lib/types";
  import { validateScore } from "$lib/utils/validation";
  import TriangleAlert from "@lucide/svelte/icons/triangle-alert";

  const p = $props<{ players: Player[] }>();
  let editingName = $state("");
  let renameError = $state<string | null>(null);
  let editingScore = $state(0);
  let scoreError = $state<string | null>(null);
  let editingPlayer = $state<Player | null>(null);

  function startEdit(player: Player) {
    editingPlayer = player;
    editingName = player.name;
    editingScore = player.score;
    renameError = null;
    scoreError = null;
  }

  async function saveChanges() {
    if (!editingPlayer) return;

    const newName = editingName.trim();
    const newScore = Number(editingScore);

    let ok = true;

    // Validate name
    if (!newName) {
      renameError = "Name cannot be empty";
      ok = false;
    } else {
      renameError = null;
    }

    // Validate score
    const { valid, error } = validateScore(newScore);
    if (!valid) {
      scoreError = error ?? "Invalid score";
      ok = false;
    } else {
      scoreError = null;
    }

    if (!ok) return;

    // Apply changes only if they differ
    if (newName !== editingPlayer.name) {
      const result = await hostUpdatePlayerName(editingPlayer.id, newName);
      renameError = result.success ? null : result.error || "Failed to rename";
      if (!result.success) return;
    }

    if (newScore !== editingPlayer.score) {
      await updatePlayerScore(editingPlayer.id, newScore);
    }

    editingPlayer = null;
  }

  function closeDrawer() {
    editingPlayer = null;
  }
</script>

<div>
  <h1 class="text-2xl font-bold text-white my-4">Players</h1>
  <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
    {#each p.players as player}
      <Drawer.Root open={editingPlayer?.id === player.id}>
        <Drawer.Trigger onclick={() => startEdit(player)}>
          <Card
            class="text-center hover:bg-accent transition-colors cursor-pointer {!player.connected
              ? 'opacity-60'
              : ''}"
          >
            <CardContent class="p-3">
              <div class="flex items-center justify-center gap-1">
                <p class="font-semibold truncate">{player.name}</p>
                {#if !player.connected}
                  <span class="text-xs text-red-600"><TriangleAlert size={16} /></span>
                {/if}
              </div>
              <p class="text-xl font-bold text-blue-600">${player.score}</p>
            </CardContent>
          </Card>
        </Drawer.Trigger>
        <Drawer.Content>
          <div class="mx-auto w-full max-w-sm">
            <Drawer.Header>
              <Drawer.Title>Edit player</Drawer.Title>
              <Drawer.Description>Make your corrections below</Drawer.Description>
            </Drawer.Header>
            <div class="px-4 space-y-3">
              <div>
                <Label for="host-edit-name" class="text-sm text-muted-foreground">Username</Label>
                <Input id="host-edit-name" type="text" bind:value={editingName} class="w-full" />
              </div>
              {#if renameError}
                <div
                  class="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm"
                >
                  {renameError}
                </div>
              {/if}

              <div>
                <Label for="host-edit-score" class="text-sm text-muted-foreground">Score</Label>
                <Input
                  id="host-edit-score"
                  type="number"
                  step="100"
                  bind:value={editingScore}
                  class="w-full"
                />
              </div>
              {#if scoreError}
                <div
                  class="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm"
                >
                  {scoreError}
                </div>
              {/if}
            </div>
            <Drawer.Footer>
              <Drawer.Close class={buttonVariants({ variant: "default" })} onclick={saveChanges}
                >Save</Drawer.Close
              >
              <Drawer.Close class={buttonVariants({ variant: "outline" })} onclick={closeDrawer}
                >Close</Drawer.Close
              >
            </Drawer.Footer>
          </div>
        </Drawer.Content>
      </Drawer.Root>
    {/each}
  </div>
</div>
