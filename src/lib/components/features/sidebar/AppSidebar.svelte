<script lang="ts">
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { usePlayer } from "$lib/composables/usePlayer.svelte";
  import { gameState, isHost } from "$lib/stores/socket";
  import type { Player } from "$lib/types";
  import Github from "@lucide/svelte/icons/github";
  import User from "@lucide/svelte/icons/user";
  import Zap from "@lucide/svelte/icons/zap";
  import type { ComponentProps } from "svelte";
  import { derived } from "svelte/store";
  import HostEditPlayerDialog from "../host/HostEditPlayerDialog.svelte";
  import RenameDialog from "../player/RenameDialog.svelte";
  import PlayerRankingMenuItem from "./PlayerRankingMenuItem.svelte";

  let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

  const players = derived(gameState, ($gameState) =>
    ($gameState?.players || []).slice().sort((a: Player, b: Player) => {
      // primary: score desc
      if (b.score !== a.score) return b.score - a.score;
      // secondary: name asc
      return a.name.localeCompare(b.name);
    })
  );

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
                    <!-- Allow editing player details -->
                    <HostEditPlayerDialog player={p}>
                      <PlayerRankingMenuItem {p} {idx} />
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
