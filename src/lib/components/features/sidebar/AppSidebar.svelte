<script lang="ts">
  import * as Collapsible from "$lib/components/ui/collapsible/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import Switch from "$lib/components/ui/switch/switch.svelte";
  import { usePlayer } from "$lib/composables/usePlayer.svelte";
  import { gameState, isHost, toggleScoring } from "$lib/stores/socket";
  import type { Player } from "$lib/types";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import Ellipsis from "@lucide/svelte/icons/ellipsis";
  import Gamepad2 from "@lucide/svelte/icons/gamepad-2";
  import Github from "@lucide/svelte/icons/github";
  import Power from "@lucide/svelte/icons/power";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
  import Settings from "@lucide/svelte/icons/settings";
  import User from "@lucide/svelte/icons/user";
  import UserRoundX from "@lucide/svelte/icons/user-round-x";
  import Zap from "@lucide/svelte/icons/zap";
  import type { ComponentProps } from "svelte";
  import { derived } from "svelte/store";
  import HostEditPlayerDialog from "../host/HostEditPlayerDialog.svelte";
  import HostEndGameDialog from "../host/HostEndGameDialog.svelte";
  import RemoveDisconnectedDialog from "../host/HostRemoveDisconnectedDialog.svelte";
  import ResetScoringDialog from "../host/HostResetScoringDialog.svelte";
  import RenameDialog from "../player/RenameDialog.svelte";
  import PlayerRankingMenuItem from "./PlayerRankingMenuItem.svelte";

  let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

  const players = derived(gameState, ($gameState) => {
    const list = ($gameState?.players || []).slice();
    // If scoring disabled and not in leaderboard phase, sort alphabetically
    const scoringOff = $gameState && $gameState.scoringEnabled === false;
    if (scoringOff && $gameState.gamePhase !== "leaderboard") {
      return list.sort((a: Player, b: Player) => a.name.localeCompare(b.name));
    }
    // Otherwise sort by score desc, then name asc
    return list.sort((a: Player, b: Player) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    });
  });

  const player = usePlayer();
  const appVersion = import.meta.env.PACKAGE_VERSION;
</script>

<Sidebar.Root collapsible="offcanvas" side="right" {...restProps}>
  <Sidebar.Header class="font-bold">
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton size="lg">
          <div
            class="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
          >
            <Zap class="size-4" />
          </div>
          <div class="flex flex-col gap-0.5 leading-none">
            <span class="font-medium">Trivia & Chill</span>
            <span class="text-muted-foreground text-xs font-normal">v{appVersion}</span>
          </div>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>

  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.GroupLabel>Leaderboard</Sidebar.GroupLabel>
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton>
            <User />
            Players ({$players.filter((p) => p.connected).length}/{$players.length})
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>

        {#if $players.length}
          <Sidebar.MenuSub>
            {#each $players as p, idx}
              <Sidebar.MenuSubItem>
                <Sidebar.MenuSubButton>
                  {#if $isHost}
                    <HostEditPlayerDialog player={p} class="w-full">
                      <PlayerRankingMenuItem {p} {idx} class="w-full" />
                    </HostEditPlayerDialog>
                  {:else}
                    <PlayerRankingMenuItem {p} {idx} />
                  {/if}
                </Sidebar.MenuSubButton>
              </Sidebar.MenuSubItem>
            {/each}
          </Sidebar.MenuSub>
        {:else}
          <div class="text-sm text-muted-foreground px-2">No players yet</div>
        {/if}
      </Sidebar.Menu>
    </Sidebar.Group>
  </Sidebar.Content>

  <Sidebar.Footer>
    <Sidebar.Menu>
      {#if $isHost}
        <Collapsible.Root class="group/collapsible">
          {#snippet child({ props })}
            <Sidebar.MenuItem {...props}>
              <Collapsible.Trigger>
                {#snippet child({ props })}
                  <Sidebar.MenuButton {...props}>
                    <div class="flex items-center gap-2">
                      <Gamepad2 size={16} />
                      Game
                    </div>

                    <ChevronRightIcon
                      class="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                    />
                  </Sidebar.MenuButton>
                {/snippet}
              </Collapsible.Trigger>
              <Collapsible.Content>
                <Sidebar.MenuSub>
                  <Sidebar.MenuSubItem>
                    <Sidebar.MenuSubButton>
                      <RemoveDisconnectedDialog class="w-full">
                        <div class="flex items-center gap-2 w-full text-xs">
                          <UserRoundX size={12} /> Remove disconnected
                        </div>
                      </RemoveDisconnectedDialog>
                    </Sidebar.MenuSubButton>
                  </Sidebar.MenuSubItem>
                  <Sidebar.MenuSubItem>
                    <Sidebar.MenuSubButton>
                      <ResetScoringDialog class="w-full">
                        <div class="flex items-center gap-2 w-full text-xs">
                          <RotateCcw size={12} /> Reset scoring
                        </div>
                      </ResetScoringDialog>
                    </Sidebar.MenuSubButton>
                  </Sidebar.MenuSubItem>
                  <Sidebar.MenuSubItem>
                    <Sidebar.MenuSubButton class="text-destructive text-xs">
                      <HostEndGameDialog class="w-full">
                        <div class="flex items-center gap-2">
                          <Power size={12} /> End game
                        </div>
                      </HostEndGameDialog>
                    </Sidebar.MenuSubButton>
                  </Sidebar.MenuSubItem>
                </Sidebar.MenuSub>
              </Collapsible.Content>
            </Sidebar.MenuItem>
          {/snippet}
        </Collapsible.Root>

        <Sidebar.MenuItem>
          <Sidebar.MenuButton>
            <div class="flex items-center gap-2">
              <Settings size={16} /> Settings
            </div>
          </Sidebar.MenuButton>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props })}
                <Sidebar.MenuAction showOnHover {...props}>
                  <Ellipsis />
                  <span class="sr-only">More</span>
                </Sidebar.MenuAction>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" side="top">
              <DropdownMenu.Item onclick={toggleScoring}>
                <Switch bind:checked={$gameState.scoringEnabled} />
                {$gameState.scoringEnabled ? "Disable" : "Enable"} scoring
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Sidebar.MenuItem>
      {/if}

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
          </a>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton disabled={$isHost}>
          <RenameDialog value={player.currentPlayer?.name}>
            <div class="flex items-center gap-2">
              <User size={16} />
              {$isHost ? "Host" : player.currentPlayer?.name || "Guest"}
            </div>
          </RenameDialog>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>
</Sidebar.Root>
