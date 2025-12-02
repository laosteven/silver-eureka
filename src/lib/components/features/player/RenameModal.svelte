<script lang="ts">
  import { buttonVariants } from "$lib/components/ui/button";
  import Button from "$lib/components/ui/button/button.svelte";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Input } from "$lib/components/ui/input";
  import { usePlayer } from "$lib/composables/usePlayer.svelte";
  import { validateUsername } from "$lib/utils/validation";

  let {
    value = $bindable(""),
  }: {
    value: string;
  } = $props();

  const player = usePlayer();
  let newUsername = $state("");
  let renameError = $state<string | null>(null);
  let open = $state(false);

  $effect(() => {
    const { valid, error: ve } = validateUsername(value);
    if (!valid) {
      renameError = ve ?? "Invalid username";
      return;
    }
    renameError = null;
  });

  async function handleRename() {
    const target = newUsername.trim();
    if (target) {
      renameError = null;
      const result = await player.rename(target);
      if (result.success) {
        newUsername = "";
        open = false; // close on success
      } else {
        renameError = result.error || "Failed to rename";
      }
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger
    class={buttonVariants({ variant: "outline" })}
    onclick={() => {
      newUsername = value;
      renameError = null;
      open = true;
    }}>Change name</Dialog.Trigger
  >
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Change your name</Dialog.Title>
      <Dialog.Description>Enter a new username below to change your name.</Dialog.Description>
    </Dialog.Header>
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
      <p class="text-sm text-yellow-800">
        <strong>⚠️ Important:</strong> To keep your current score, use the same name when you rejoin.
      </p>
    </div>
    <Input
      type="text"
      bind:value={newUsername}
      maxlength={20}
      class="text-lg py-6"
      placeholder="Enter new name"
      aria-invalid={!!renameError}
      oninput={() => {
        if (renameError) {
          renameError = null;
        }
      }}
    />
    {#if renameError}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p class="text-sm font-semibold">{renameError}</p>
      </div>
    {/if}
    <div class="flex gap-2">
      <Dialog.Close class={buttonVariants({ variant: "outline" }) + " flex-1"}>Cancel</Dialog.Close>
      <Button
        type="submit"
        class={buttonVariants({ variant: "default" }) + " flex-1"}
        disabled={!newUsername.trim()}
        onclick={handleRename}
      >
        Change name
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
