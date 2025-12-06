<script lang="ts">
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { useGame } from "$lib/composables/useGame.svelte";
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  let {
    children,
    class: className,
  }: {
    children: Snippet | null;
    class?: ClassValue | null | undefined;
  } = $props();

  let open = $state(false);

  function confirmEnding() {
    const game = useGame();
    game.resetGame();
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger onclick={() => (open = true)} class={className}>
    {@render children?.()}
  </Dialog.Trigger>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>End game</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to end the game? All scores will be lost and players will return to
        the lobby.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <div class="flex w-full justify-center gap-4">
        <Dialog.Close class={buttonVariants({ variant: "outline" }) + " flex-1"}>
          Cancel
        </Dialog.Close>
        <Button onclick={confirmEnding} class="flex-1" variant="destructive">End game</Button>
      </div>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
