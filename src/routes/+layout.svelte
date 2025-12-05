<script lang="ts">
  import { browser } from "$app/environment";
  import ToggleMode from "$lib/components/features/toggleMode/ToggleMode.svelte";
  import { buttonVariants } from "$lib/components/ui/button";
  import ButtonGroup from "$lib/components/ui/button-group/button-group.svelte";
  import { gameConfig, initSocket } from "$lib/stores/socket";
  import Github from "@lucide/svelte/icons/github";
  import { ModeWatcher } from "mode-watcher";
  import { onMount } from "svelte";
  import "./layout.css";

  let { children } = $props();

  onMount(() => {
    if (browser) {
      initSocket();
    }
  });
</script>

<svelte:head>
  <title>{$gameConfig.title}</title>
  <meta name="description" content="Self-hosted trivia game" />
</svelte:head>

{@render children()}

<ModeWatcher />
<div class="fixed top-4 right-4">
  <ButtonGroup>
    <a
      href="https://github.com/laosteven/trivia-n-chill"
      target="_blank"
      rel="noopener noreferrer"
      class={buttonVariants({ variant: "outline", size: "icon" })}
      title="View on GitHub"
    >
      <Github />
    </a>
    <ToggleMode />
  </ButtonGroup>
</div>
