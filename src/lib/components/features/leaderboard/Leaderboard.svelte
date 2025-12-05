<script lang="ts">
  import ScrollArea from "$lib/components/ui/scroll-area/scroll-area.svelte";
  import TriangleAlert from "@lucide/svelte/icons/triangle-alert";
  import { onMount } from "svelte";

  const p = $props<{
    players: { id: string; name: string; score: number; connected: boolean }[];
  }>();

  // Credit roll options
  const WAIT_MS = 5000; // wait before starting the roll
  const DURATION_MS = 20000; // duration of the scroll animation
  const PAUSE_MS = 1000; // pause at bottom before scrolling back
  const LOOP = true; // set to true to continuously loop the roll

  let viewport = $state<HTMLElement | null>(null);

  // smooth scroll helper: animate from current scrollTop to target over duration
  // Returns a promise that resolves when animation completes and provides a cancel function
  function smoothScrollTo(element: HTMLElement, target: number, duration: number) {
    return new Promise<void>((resolve) => {
      const start = element.scrollTop;
      const change = target - start;
      const startTime = performance.now();
      let rafId: number | null = null;

      function animate(now: number) {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        // ease-in-out cubic
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        element.scrollTop = start + change * eased;
        if (t < 1) rafId = requestAnimationFrame(animate);
        else resolve();
      }

      rafId = requestAnimationFrame(animate);

      // attach cancel helper to element for cleanup if needed
      (element as any).__rafId = rafId;
    });
  }

  onMount(() => {
    let destroyed = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function runLoop() {
      // initial wait
      await new Promise((r) => (timer = setTimeout(r, WAIT_MS)));
      if (destroyed) return;

      do {
        if (!viewport) return;
        const bottom = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
        if (bottom > 0) {
          await smoothScrollTo(viewport, bottom, DURATION_MS);
          if (destroyed) return;
          // pause at bottom
          await new Promise((r) => (timer = setTimeout(r, PAUSE_MS)));
          if (destroyed) return;
          // scroll back to top
          await smoothScrollTo(viewport, 0, DURATION_MS);
        }
      } while (LOOP && !destroyed);
    }

    runLoop().catch(() => {});

    return () => {
      destroyed = true;
      if (timer) clearTimeout(timer);
      if (viewport && (viewport as any).__rafId) cancelAnimationFrame((viewport as any).__rafId);
    };
  });
</script>

<div class="space-y-4">
  <ScrollArea class="h-96" bind:viewportRef={viewport}>
    {#each [...p.players].sort((a, b) => b.score - a.score) as player, index}
      <div
        class="flex items-center justify-between p-4 rounded-lg bg-secondary mb-2 {!player.connected
          ? 'opacity-60'
          : ''}"
      >
        <div class="flex items-center gap-4">
          <span class="text-xl text-muted-foreground">
            {#if index === 0}🥇{:else if index === 1}🥈{:else if index === 2}🥉{:else}{index +
                1}{/if}
          </span>
          <div class="flex items-center gap-2">
            <span class="font-semibold text-xl">{player.name}</span>
            {#if !player.connected}
              <span class="text-xs text-red-600 font-semibold"><TriangleAlert size={16} /></span>
            {/if}
          </div>
        </div>
        <span class="text-2xl font-bold text-blue-600">${player.score}</span>
      </div>
    {/each}
  </ScrollArea>
</div>
