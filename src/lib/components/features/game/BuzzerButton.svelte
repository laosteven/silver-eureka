<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import Zap from "@lucide/svelte/icons/zap";

  const p = $props<{ onBuzz: () => void }>();
</script>

<div class="w-full aspect-square">
  <Button
    onclick={p.onBuzz}
    class="w-full h-full flex flex-col items-center justify-center transition-all duration-100 shadow-2xl bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 active:scale-95 rounded-xl"
  >
    <Zap class="text-white drop-shadow-lg" style="width: 96px; height: 96px;" />
    <span class="text-2xl font-black uppercase tracking-widest text-white">BUZZ</span>
  </Button>
</div>
