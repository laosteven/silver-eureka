<script lang="ts">
  import { browser } from "$app/environment";
  import { buttonVariants } from "$lib/components/ui/button";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { usePlayer } from "$lib/composables/usePlayer.svelte";
  import { gameState, hostUpdatePlayerName, updatePlayerScore } from "$lib/stores/socket";
  import type { Player } from "$lib/types";
  import Github from "@lucide/svelte/icons/github";
  import User from "@lucide/svelte/icons/user";
  import type { ComponentProps } from "svelte";
  import { onMount } from "svelte";
  import { derived } from "svelte/store";

  let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

  const players = derived(gameState, ($gameState) =>
    ($gameState?.players || []).slice().sort((a: Player, b: Player) => b.score - a.score)
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
            {#each $players as p}
              <Sidebar.MenuSubItem>
                <Sidebar.MenuSubButton class="w-full">
                  {#if isHost}
                    <Dialog.Trigger
                      onclick={() => openEditor(p)}
                      class="flex text-xs font-normal w-full justify-between rounded-lg"
                    >
                      <div class="truncate">{p.name}</div>
                      <div class="text-muted-foreground">${p.score}</div>
                    </Dialog.Trigger>
                  {:else}
                    <div class="flex text-xs font-normal p-2 w-full justify-between rounded-lg">
                      <div class="truncate">{p.name}</div>
                      <div class="text-muted-foreground">${p.score}</div>
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
          <Sidebar.MenuButton
            class="text-xs text-muted-foreground w-full justify-between text-xs text-muted-foreground"
          >
            <div class="flex items-center gap-1">
              <a
                href="https://github.com/laosteven/trivia-n-chill"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github size={16} />
              </a>
            </div>
            <a
              class="text-muted-foreground text-sm hover:underline font-normal"
              href="https://github.com/laosteven/trivia-n-chill/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
            >
              (v.{appVersion})
            </a>
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Footer>
  </Sidebar.Root>

  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Edit Player</Dialog.Title>
    </Dialog.Header>
    <div class="space-y-3">
      <Label for="name">Name</Label>
      <Input id="name" type="text" bind:value={editingName} />
      <Label for="score">Score</Label>
      <Input id="score" type="number" step="10" bind:value={editingScore} />
    </div>
    <Dialog.Footer>
      <Button onclick={save}>Save</Button>
      <Dialog.Close class={buttonVariants({ variant: "outline" })}>Cancel</Dialog.Close>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
