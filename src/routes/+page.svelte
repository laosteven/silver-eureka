<script lang="ts">
  import { browser } from "$app/environment";
  import { gameConfig, initSocket } from "$lib/stores/socket";
  import Heart from "@lucide/svelte/icons/heart";
  import Zap from "@lucide/svelte/icons/zap";
  import { onMount } from "svelte";

  onMount(() => {
    if (browser) {
      initSocket();
    }
  });
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500/30">
  <div
    class="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-12 relative overflow-hidden"
  >
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(30,58,138,.2),_rgba(2,6,23),_rgba(2,6,23))] from-blue-900/20 via-slate-950 to-slate-950 z-0"
    ></div>
    <div class="relative z-10 space-y-6 max-w-2xl">
      <div class="space-y-2">
        <h1
          class="text-6xl font-bold uppercase tracking-tighter bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent drop-shadow-lg"
        >
          {$gameConfig.title}
        </h1>
        <p class="text-slate-400 uppercase text-lg tracking-wide font-medium">The trivia game</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xs md:max-w-lg mx-auto mt-12">
        <button
          class="group relative rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 hover:border-amber-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1"
        >
          <a href="/host" class="p-8 block">
            <div class="flex flex-col items-center gap-4">
              <div
                class="p-4 rounded-full bg-slate-950 border border-slate-800 group-hover:border-amber-500/50 transition-colors"
              >
                <Heart />
              </div>
              <div class="space-y-1">
                <h3 class="text-xl font-semibold text-slate-200 group-hover:text-white">
                  Host dashboard
                </h3>
                <p class="text-sm text-slate-500 group-hover:text-slate-400">
                  Control the board &amp; scores
                </p>
              </div>
            </div>
          </a>
        </button>
        <button
          class="group relative rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1"
        >
          <a href="/play" class="p-8 block">
            <div class="flex flex-col items-center gap-4">
              <div
                class="p-4 rounded-full bg-slate-950 border border-slate-800 group-hover:border-blue-500/50 transition-colors"
              >
                <Zap />
              </div>
              <div class="space-y-1">
                <h3 class="text-xl font-semibold text-slate-200 group-hover:text-white">
                  Player buzzer
                </h3>
                <p class="text-sm text-slate-500 group-hover:text-slate-400">Join the game</p>
              </div>
            </div>
          </a>
        </button>
      </div>
    </div>
  </div>
</div>
