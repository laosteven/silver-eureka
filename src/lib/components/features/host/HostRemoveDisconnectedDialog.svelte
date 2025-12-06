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

  function confirmRemove() {
    const game = useGame();
    game.clearDisconnected();
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger onclick={() => (open = true)} class={className}>
    {@render children?.()}
  </Dialog.Trigger>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Remove disconnected players</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to remove all disconnected players?
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <div class="flex w-full justify-center gap-4">
        <Dialog.Close class={buttonVariants({ variant: "outline" }) + " flex-1"}>
          Cancel
        </Dialog.Close>
        <Button onclick={confirmRemove} class="flex-1" variant="destructive">Remove</Button>
      </div>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
