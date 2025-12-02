/**
 * Buzzer Composable
 * Manages buzzer audio generation and playback
 */

import { browser } from "$app/environment";
import { buzzerSound } from "$lib/stores/socket";

export function useBuzzer() {
  let buzzerAudio: { play: () => Promise<void> } | null = $state(null);
  let audioContextRef: AudioContext | null = null;
  let cooldownMs = 500;
  let lastPlayAt = 0;

  /**
   * Initialize buzzer audio using Web Audio API
   */
  function init(options?: { cooldownMs?: number }) {
    if (!browser) return;

    try {
      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef = audioContext;
      if (options?.cooldownMs != null && options.cooldownMs >= 0) {
        cooldownMs = options.cooldownMs;
      }
      // Attempt to unlock audio on first interaction if suspended
      const unlock = () => {
        if (audioContext.state === "suspended") {
          audioContext.resume().catch(() => {});
        }
        document.removeEventListener("pointerdown", unlock);
        document.removeEventListener("keydown", unlock);
      };
      document.addEventListener("pointerdown", unlock);
      document.addEventListener("keydown", unlock);
      // Prepare buzzer interface that builds nodes per play
      const durationSec = 0.6; // slightly longer tail
      buzzerAudio = {
        play: () => {
          if (!audioContextRef) return Promise.resolve();
          const ctx = audioContextRef;
          const now = ctx.currentTime;

          // Create nodes fresh each time to avoid start() reuse errors
          const carrier = ctx.createOscillator();
          const modulator = ctx.createOscillator();
          const modGain = ctx.createGain();
          const outGain = ctx.createGain();
          const highpass = ctx.createBiquadFilter();

          // Routing
          modulator.connect(modGain);
          modGain.connect(carrier.frequency);
          carrier.connect(highpass);
          highpass.connect(outGain);
          outGain.connect(ctx.destination);

          // Carrier and modulator setup
          carrier.type = "sine";
          carrier.frequency.setValueAtTime(820, now);
          carrier.frequency.exponentialRampToValueAtTime(880, now + 0.08);

          modulator.type = "sine";
          modulator.frequency.setValueAtTime(1450, now);

          // Mod index envelope
          modGain.gain.setValueAtTime(120, now);
          modGain.gain.exponentialRampToValueAtTime(8, now + 0.08);
          modGain.gain.exponentialRampToValueAtTime(1, now + 0.25);

          // Output envelope
          outGain.gain.setValueAtTime(0.0001, now);
          outGain.gain.exponentialRampToValueAtTime(0.6, now + 0.015);
          outGain.gain.exponentialRampToValueAtTime(0.22, now + 0.20);
          outGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

          // Filter
          highpass.type = "highpass";
          highpass.frequency.setValueAtTime(220, now);
          highpass.Q.setValueAtTime(0.7, now);

          // Optional tiny convolution tail per play (cheap impulse)
          try {
            const irLen = Math.floor(ctx.sampleRate * 0.18);
            const ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
            for (let ch = 0; ch < ir.numberOfChannels; ch++) {
              const d = ir.getChannelData(ch);
              for (let i = 0; i < irLen; i++) {
                const t = i / ctx.sampleRate;
                const decay = Math.pow(1 - t / 0.18, 2.5);
                d[i] = (Math.random() * 2 - 1) * 0.04 * decay;
              }
            }
            const convolver = ctx.createConvolver();
            convolver.buffer = ir;
            const mixWet = ctx.createGain();
            const mixDry = ctx.createGain();
            mixWet.gain.setValueAtTime(0.18, now);
            mixDry.gain.setValueAtTime(1.0, now);
            carrier.connect(mixDry);
            mixDry.connect(highpass);
            carrier.connect(convolver);
            convolver.connect(outGain);
          } catch (e) {
            console.debug("Convolver per-play skipped:", e);
          }

          // Start and schedule stop
          carrier.start(now);
          modulator.start(now);
          carrier.stop(now + durationSec + 0.02);
          modulator.stop(now + durationSec + 0.02);

          return Promise.resolve();
        },
      };
    } catch (error) {
      console.error("Failed to initialize buzzer audio:", error);
    }
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
