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
      const buffer = audioContext.createBuffer(
        1,
        audioContext.sampleRate * 0.2,
        audioContext.sampleRate
      );
      const data = buffer.getChannelData(0);

      // Generate a beep sound (440 Hz for 0.2 seconds)
      for (let i = 0; i < data.length; i++) {
        const t = i / audioContext.sampleRate;
        data[i] = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t * 5);
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
      let signal: null | { playerName: string } = null;
      buzzerSound.subscribe((v) => (signal = v))();
      if (signal) {
        play();
      }
    });
  }

  return {
    init,
    play,
    setupAutoPlay,
  };
}
