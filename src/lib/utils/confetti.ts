// Lightweight wrapper around canvas-confetti with dynamic import
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let confettiImpl: any;

async function load() {
  if (typeof window === "undefined") return null;
  if (confettiImpl) return confettiImpl;
  const mod = await import("canvas-confetti");
  confettiImpl = mod.default || mod;
  return confettiImpl;
}

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export async function celebrateCorrect(duration = 1000) {
  const confetti = await load();
  if (!confetti) return;

  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = Math.floor(50 * (timeLeft / duration));
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
}

export async function celebrateLeaderboard(duration = 15000) {
  const confetti = await load();
  if (!confetti) return;

  const end = Date.now() + duration;

  (function frame() {
    confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 } });
    confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 } });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

export async function playerEmojiReact(emoji: string) {
  const confetti = await load();
  const emojiShape = confetti.shapeFromText({ text: emoji });
  if (!confetti) return;
  confetti({
    particleCount: 30,
    spread: 100,
    shapes: [emojiShape],
    origin: { x: Math.random(), y: 1 },
    scalar: (Math.random() * 3) + 1,
  });
}

export default { celebrateCorrect, celebrateLeaderboard, playerEmojiReact };
