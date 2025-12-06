<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import Trophy from "@lucide/svelte/icons/trophy";

  const p = $props<{
    title: string;
    onRevealScoring: () => void;
  }>();
</script>

<div class="flex justify-between items-center mb-4">
  <h1 class="text-2xl uppercase font-bold text-white">{p.title}</h1>
  <div class="space-x-2">
    <Button onclick={p.onRevealScoring} variant="ghost">
      <Trophy /> Finish game
    </Button>
  </div>
</div>
