<script lang="ts">
  import Button, { buttonVariants } from "$lib/components/ui/button/button.svelte";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as InputGroup from "$lib/components/ui/input-group/index.js";
  import Input from "$lib/components/ui/input/input.svelte";
  import Label from "$lib/components/ui/label/label.svelte";
  import { hostUpdatePlayerName, removePlayer, updatePlayerScore } from "$lib/stores/socket";
  import type { Player } from "$lib/types";
  import Minus from "@lucide/svelte/icons/minus";
  import Plus from "@lucide/svelte/icons/plus";
  import type { Snippet } from "svelte";

  let {
    player,
    children,
  }: {
    player: Player;
    children: Snippet | null;
  } = $props();

  let selected: Player | null = null;
  let editingScore = $state(0);
  let editingName = $state("");
  let open = $state(false);

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

  async function handleRemove() {
    if (!selected) return;
    removePlayer(selected.id);
    open = false;
    selected = null;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger
    onclick={() => openEditor(player)}
    class="flex text-xs font-normal w-full justify-between rounded-lg p-2"
  >
    {@render children?.()}
  </Dialog.Trigger>
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
      <Button variant="destructive" class="flex-1" onclick={handleRemove}>Remove</Button>
      <Dialog.Close class={buttonVariants({ variant: "outline" }) + " flex-1"}>Cancel</Dialog.Close>
      <Button onclick={save} class="flex-1">Save</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
