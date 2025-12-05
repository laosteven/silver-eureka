<script lang="ts">
  import { browser } from "$app/environment";
  import { buttonVariants } from "$lib/components/ui/button";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Input } from "$lib/components/ui/input";
  import * as InputGroup from "$lib/components/ui/input-group/index.js";
  import { Label } from "$lib/components/ui/label";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { usePlayer } from "$lib/composables/usePlayer.svelte";
  import { gameState, hostUpdatePlayerName, updatePlayerScore } from "$lib/stores/socket";
  import type { Player } from "$lib/types";
  import Github from "@lucide/svelte/icons/github";
  import Minus from "@lucide/svelte/icons/minus";
  import Plus from "@lucide/svelte/icons/plus";
  import Settings from "@lucide/svelte/icons/settings";
  import User from "@lucide/svelte/icons/user";
  import type { ComponentProps } from "svelte";
  import { onMount } from "svelte";
  import { derived } from "svelte/store";
  import RenameDialog from "../player/RenameDialog.svelte";

  let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

  const players = derived(gameState, ($gameState) =>
    ($gameState?.players || []).slice().sort((a: Player, b: Player) => {
      // primary: score desc
      if (b.score !== a.score) return b.score - a.score;
      // secondary: name asc
      return a.name.localeCompare(b.name);
    })
  );

  let selected: Player | null = null;
  let editingScore = $state(0);
  let editingName = $state("");
  let open = $state(false);
  let isHost = $state(false);

  onMount(() => {
    isHost = browser && window.location.pathname.startsWith("/host");
  });

  const player = usePlayer();
  const appVersion = import.meta.env.PACKAGE_VERSION;
  const skipValue = 10;

  function openEditor(p: Player) {
    selected = { ...p };
    editingScore = p.score;
    editingName = p.name;
    open = true;
  }

  async function save() {
    if (!selected) return;

    // Update name if changed
    const newName = editingName.trim();
    if (newName && newName !== selected.name) {
      const res = await hostUpdatePlayerName(selected.id, newName);
      if (!res.success) {
        // keep dialog open on error
        return;
      }
    }

    // Update score if changed
    const newScore = Number(editingScore);
    if (!Number.isNaN(newScore) && newScore !== selected.score) {
      await updatePlayerScore(selected.id, newScore);
    }

    open = false;
    selected = null;
  }

  function incrementScore() {
    editingScore = Number(editingScore) + skipValue;
  }

  function decrementScore() {
    editingScore = Number(editingScore) - skipValue;
  }
</script>

<Dialog.Root bind:open>
  <Sidebar.Root collapsible="offcanvas" side="right" {...restProps}>
    <Sidebar.Header class="font-bold">
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton>
            <span class="text-base font-semibold">Trivia & Chill</span>
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Header>

    <Sidebar.Content>
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton>
            <User />
            Players ({$players.length})
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>

        {#if $players.length}
          <Sidebar.MenuSub>
            {#each $players as p, idx}
              <Sidebar.MenuSubItem>
                <Sidebar.MenuSubButton class="w-full">
                  {#if isHost}
                    <Dialog.Trigger
                      onclick={() => openEditor(p)}
                      class="flex text-xs font-normal w-full justify-between rounded-lg p-2"
                    >
                      <div class="flex items-center gap-2 truncate">
                        <span class="text-muted-foreground w-6">#{idx + 1}</span>
                        <span
                          class="{p.id === player.currentPlayer?.id && 'font-bold'} {!p.connected &&
                            'opacity-20'}">{p.name}</span
                        >
                      </div>
                      <div
                        class="text-muted-foreground"
                        class:font-bold={p.id === player.currentPlayer?.id}
                      >
                        ${p.score}
                      </div>
                    </Dialog.Trigger>
                  {:else}
                    <div class="flex text-xs font-normal p-2 w-full justify-between rounded-lg">
                      <div class="flex items-center gap-2 truncate">
                        <span class="text-muted-foreground w-6">#{idx + 1}</span>
                        <span
                          class="{p.id === player.currentPlayer?.id && 'font-bold'} {!p.connected &&
                            'opacity-20'}">{p.name}</span
                        >
                      </div>
                      <div
                        class="text-muted-foreground"
                        class:font-bold={p.id === player.currentPlayer?.id}
                      >
                        ${p.score}
                      </div>
                    </div>
                  {/if}
                </Sidebar.MenuSubButton>
              </Sidebar.MenuSubItem>
            {/each}
          </Sidebar.MenuSub>
        {:else}
          <div class="text-sm text-muted-foreground px-2">No players yet</div>
        {/if}
      </Sidebar.Menu>
    </Sidebar.Content>

    <Sidebar.Footer>
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton>
            <a
              class="flex items-center justify-between w-full"
              href="https://github.com/laosteven/trivia-n-chill"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div class="flex items-center gap-2">
                <Github size={16} />
                GitHub
              </div>
              <div class="text-xs text-muted-foreground/30">
                [v.{appVersion}]
              </div>
            </a>
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton disabled><Settings /> Settings</Sidebar.MenuButton>
        </Sidebar.MenuItem>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton disabled={isHost}>
            <RenameDialog value={player.currentPlayer?.name}>
              <div class="flex items-center gap-2">
                <User size={16} />
                {isHost ? "Host" : player.currentPlayer?.name || "Guest"}
              </div>
            </RenameDialog>
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Footer>
  </Sidebar.Root>

  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Edit player</Dialog.Title>
    </Dialog.Header>
    <div class="space-y-3">
      <Label for="name">Name</Label>
      <Input id="name" type="text" bind:value={editingName} />

      <Label for="score">Score</Label>
      <InputGroup.Root>
        <InputGroup.Addon>
          <InputGroup.Button size="icon-xs" variant="secondary" onclick={decrementScore}>
            <Minus />
          </InputGroup.Button>
        </InputGroup.Addon>
        <InputGroup.Input
          id="score"
          type="number"
          step={skipValue}
          bind:value={editingScore}
          class="w-full text-center"
        />
        <InputGroup.Addon align="inline-end">
          <InputGroup.Button size="icon-xs" variant="secondary" onclick={incrementScore}>
            <Plus />
          </InputGroup.Button>
        </InputGroup.Addon>
      </InputGroup.Root>
    </div>
    <Dialog.Footer class="flex w-full gap-2 space-x-2">
      <Dialog.Close class={buttonVariants({ variant: "outline" }) + " flex-1"}>Cancel</Dialog.Close>
      <Button onclick={save} class="flex-1">Save</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
