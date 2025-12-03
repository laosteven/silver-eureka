/**
 * Buzzer Composable
 * Manages buzzer audio generation and playback
 */

import { browser } from "$app/environment";
import { buzzerSound } from "$lib/stores/socket";

export function useBuzzer() {
  let buzzerAudio: { play: () => Promise<void> } | null = $state(null);
  let cooldownMs = 500;
  let lastPlayAt = 0;

  /**
   * Initialize buzzer audio using Web Audio API
   */
  function init(options?: { cooldownMs?: number }) {
    if (!browser) return;
    // Switch to using a short buzzer MP3 to ensure consistent playback across browsers
    if (options?.cooldownMs != null && options.cooldownMs >= 0) {
      cooldownMs = options.cooldownMs;
    }

    const buzzerUrl = "/sounds/buzzer.mp3";
    buzzerAudio = {
      play: async () => {
        try {
          const a = new Audio(buzzerUrl);
          a.preload = "auto";
          await a.play().catch(() => {});
        } catch (e) {
          console.debug("Buzzer play failed:", e);
        }
        return Promise.resolve();
      },
    };
  }

  /**
   * Play buzzer sound (respects cooldown)
   */
  async function play() {
    if (buzzerAudio) {
      const nowMs = performance.now();
      if (nowMs - lastPlayAt < cooldownMs) {
        return; // skip if within cooldown period
      }
      try {
        await buzzerAudio.play();
        lastPlayAt = nowMs;
      } catch (error) {
        console.error("Failed to play buzzer sound:", error);
      }
    }
  }

  /**
   * Setup effect to play sound when buzzer signal received
   */
  function setupAutoPlay() {
    if (!browser) return;

    $effect(() => {
      const unsubscribe = buzzerSound.subscribe((v) => {
        if (v) {
          play();
        }
      });
      return () => unsubscribe();
    });
  }

  return {
    init,
    play,
    setupAutoPlay,
    setCooldown(ms: number) {
      if (typeof ms === "number" && ms >= 0) {
        cooldownMs = ms;
      }
    },
  };
}
