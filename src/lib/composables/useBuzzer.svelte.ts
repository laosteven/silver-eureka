/**
 * Buzzer Composable
 * Manages buzzer audio generation and playback
 */

import { browser } from "$app/environment";
import { buzzerSound } from "$lib/stores/socket";

export function useBuzzer() {
  let buzzerAudio: { play: () => Promise<void> } | null = $state(null);

  /**
   * Initialize buzzer audio using Web Audio API
   */
  function init() {
    if (!browser) return;

    try {
      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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
      // Friendly notification-style chime
      const durationSec = 0.35;
      const fundamentalStart = 740; // approx F#5
      const fundamentalEnd = 784;   // approx G5 (small glide up)
      const fifthRatio = 1.5;       // perfect fifth
      const sampleCount = Math.floor(audioContext.sampleRate * durationSec);
      const buffer = audioContext.createBuffer(1, sampleCount, audioContext.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < sampleCount; i++) {
        const t = i / audioContext.sampleRate;
        // Glide fundamental frequency linearly
        const f = fundamentalStart + (fundamentalEnd - fundamentalStart) * (t / durationSec);
        const phaseFund = 2 * Math.PI * f * t;
        const phaseFifth = 2 * Math.PI * (f * fifthRatio) * t;
        const sineFund = Math.sin(phaseFund);
        const sineFifth = 0.55 * Math.sin(phaseFifth);
        const tri = (2 / Math.PI) * Math.asin(Math.sin(phaseFund)) * 0.3;

        // Envelope: slow attack (12ms), gentle decay with eased tail
        const attack = 0.012;
        let envelope: number;
        if (t < attack) {
          envelope = t / attack; // linear attack
        } else {
          const decayT = (t - attack) / (durationSec - attack);
          // Use (1 - decayT)^3 for a smooth cubic decay
          envelope = Math.pow(1 - decayT, 3);
        }

        // Slight overall amplitude shaping to avoid clipping
        const sample = (sineFund + sineFifth + tri) * 0.7 * envelope;
        data[i] = sample;
      }

      buzzerAudio = {
        play: () => {
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.destination);
          source.start();
          return Promise.resolve();
        },
      };
    } catch (error) {
      console.error("Failed to initialize buzzer audio:", error);
    }
  }

  /**
   * Play buzzer sound
   */
  async function play() {
    if (buzzerAudio) {
      try {
        await buzzerAudio.play();
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
  };
}
