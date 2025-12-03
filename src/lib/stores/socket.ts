import type { ClientGameState } from "$lib/types";
import { io, type Socket } from "socket.io-client";
import { get, writable } from "svelte/store";

interface GameConfigClient {
  title: string;
  categories: {
    name: string;
    questions: { value: number }[];
  }[];
  typewriter?: {
    enabled?: boolean;
    speedMsPerChar?: number;
    delayBeforeMediaMs?: number;
  };
  emoji?: {
    cost?: number;
    allowNegative?: boolean;
    maxActive?: number;
    cooldownMs?: number;
    displayDurationMs?: number;
  };
}

interface FullQuestion {
  category: string;
  question: string;
  answer: string;
  value: number;
  questionImage?: string;
  questionYoutube?: string;
  answerImage?: string;
  answerYoutube?: string;
}

let socket: Socket | null = null;

export const connected = writable(false);
export const gameState = writable<ClientGameState & { showAnswer?: boolean }>({
  players: [],
  currentQuestion: null,
  currentCategory: null,
  answeredQuestions: [],
  buzzerOrder: [],
  buzzerLocked: true,
  gamePhase: "lobby",
  showAnswer: false,
});
export const gameConfig = writable<GameConfigClient>({
  title: "",
  categories: [],
  typewriter: { enabled: true, speedMsPerChar: 20, delayBeforeMediaMs: 300 },
  emoji: { cost: 10, allowNegative: false, maxActive: 5, cooldownMs: 0, displayDurationMs: 4000 },
});
export const fullQuestion = writable<FullQuestion | null>(null);
export const playerId = writable<string>("");
export const buzzerSound = writable<{ playerName: string } | null>(null);
export const hostEmojiReaction = writable<{ playerName: string; emoji: string } | null>(null);
export const joinError = writable<string | null>(null);
export const hostNotification = writable<{ message: string } | null>(null);
export const updatedUsername = writable<string | null>(null);

export function initSocket() {
  if (socket) return socket;

  // Only initialize socket on the client side
  if (typeof window === "undefined") {
    return null;
  }

  socket = io(window.location.origin);

  socket.on("connect", () => {
    connected.set(true);
    playerId.set(socket?.id || "");
  });

  socket.on("disconnect", () => {
    connected.set(false);
  });

  socket.on("gameState", (state: ClientGameState & { showAnswer?: boolean }) => {
    // Compare previous state to detect score changes or phase transitions
    gameState.set(state);
    try {
      if (typeof window !== "undefined") {
        // previous state stored on the module
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prev: ClientGameState | null = (initSocket as any)._prevGameState || null;
        const myId = get(playerId);

        // If our score increased, celebrate
        if (prev && myId) {
          const prevPlayer = prev.players.find((p) => p.id === myId);
          const newPlayer = state.players.find((p) => p.id === myId);
          if (newPlayer && prevPlayer && newPlayer.score > prevPlayer.score) {
            import("$lib/utils/confetti").then((m) => m.celebrateCorrect()).catch(() => {});
          }
        }

        // store prev state for next comparison
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (initSocket as any)._prevGameState = state;
      }
    } catch (e) {
      console.log("Confetti error:", e);
    }
  });

  socket.on("gameConfig", (config: GameConfigClient) => {
    gameConfig.set(config);
  });

  socket.on("fullQuestion", (question: FullQuestion) => {
    fullQuestion.set(question);
  });

  socket.on("buzzerSound", (data: { playerName: string }) => {
    buzzerSound.set(data);
    // Clear after a short delay
    setTimeout(() => buzzerSound.set(null), 100);
  });

  socket.on("joinError", (data: { error: string }) => {
    joinError.set(data.error);
  });

  socket.on("updateUsername", (data: { newUsername: string }) => {
    // Update localStorage with new username
    if (typeof window !== "undefined") {
      localStorage.setItem("jeopardy-game_username", data.newUsername);
    }
    updatedUsername.set(data.newUsername);
  });

  socket.on("hostNotification", (data: { message: string }) => {
    hostNotification.set(data);
    // Auto-clear after 5 seconds
    setTimeout(() => hostNotification.set(null), 5000);
  });

  // Play correct/incorrect sounds when server notifies
  socket.on("correctAnswer", () => {
    try {
      const url = "https://cdn.freesound.org/previews/395/395806_4877562-lq.mp3";
      const a = new Audio(url);
      a.preload = "auto";
      a.play().catch(() => {});
    } catch (e) {
      console.debug("Play correct sound failed", e);
    }
  });

  socket.on("incorrectAnswer", () => {
    try {
      const url = "https://cdn.freesound.org/previews/750/750933_16155788-lq.mp3";
      const a = new Audio(url);
      a.preload = "auto";
      a.play().catch(() => {});
    } catch (e) {
      console.debug("Play incorrect sound failed", e);
    }
  });

  socket.on("emojiReaction", (data: { emoji: string; playerName?: string }) => {
    hostEmojiReaction.set({ playerName: data.playerName || "", emoji: data.emoji });
    // Clear after configured display duration (fallback to 4000ms)
    const duration = get(gameConfig)?.emoji?.displayDurationMs ?? 4000;
    setTimeout(() => hostEmojiReaction.set(null), duration);
    // Trigger emoji confetti on host clients as well
    import("$lib/utils/confetti").then((m) => m.playerEmojiReact(data.emoji)).catch(() => {});
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function hostJoin() {
  socket?.emit("hostJoin");
}

export function playerJoin(username: string): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    if (!socket) {
      resolve({ success: false, error: "Not connected" });
      return;
    }
    socket.emit("playerJoin", username, (result: { success: boolean; error?: string }) => {
      if (!result.success) {
        joinError.set(result.error || "Failed to join");
      }
      resolve(result);
    });
  });
}

export function startGame() {
  socket?.emit("startGame");
}

export function selectQuestion(category: string, value: number) {
  socket?.emit("selectQuestion", { category, value });
}

export function buzz() {
  socket?.emit("buzz");
}

export function lockBuzzer() {
  socket?.emit("lockBuzzer");
}

export function unlockBuzzer() {
  socket?.emit("unlockBuzzer");
}

export function clearBuzzers() {
  socket?.emit("clearBuzzers");
}

export function removeBuzz(playerId: string) {
  socket?.emit("removeBuzz", playerId);
}

export function revealAnswer() {
  socket?.emit("revealAnswer");
}

export function correctAnswer(targetPlayerId: string) {
  socket?.emit("correctAnswer", targetPlayerId);
  fullQuestion.set(null);
}

export function incorrectAnswer(targetPlayerId: string) {
  socket?.emit("incorrectAnswer", targetPlayerId);
}

export function skipQuestion() {
  socket?.emit("skipQuestion");
  fullQuestion.set(null);
}

export function cancelQuestion() {
  socket?.emit("cancelQuestion");
  fullQuestion.set(null);
}

export function showLeaderboard() {
  socket?.emit("showLeaderboard");
  fullQuestion.set(null);
}

export function backToGame() {
  socket?.emit("backToGame");
}

export function resetGame() {
  socket?.emit("resetGame");
  fullQuestion.set(null);
}

export function clearPlayers() {
  socket?.emit("clearPlayers");
  fullQuestion.set(null);
}

export function removePlayer(playerId: string) {
  socket?.emit("removePlayer", playerId);
}

export function clearDisconnected() {
  socket?.emit("clearDisconnected");
}

export function reloadConfig() {
  socket?.emit("reloadConfig");
}

export function updatePlayerScore(playerId: string, newScore: number) {
  socket?.emit("updatePlayerScore", { playerId, newScore });
}

export function playerRename(newUsername: string): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    if (!socket) {
      resolve({ success: false, error: "Not connected" });
      return;
    }
    socket.emit("playerRename", newUsername, (result: { success: boolean; error?: string }) => {
      if (!result.success) {
        joinError.set(result.error || "Failed to rename");
      }
      resolve(result);
    });
  });
}

export function hostUpdatePlayerName(
  playerId: string,
  newName: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    if (!socket) {
      resolve({ success: false, error: "Not connected" });
      return;
    }
    socket.emit(
      "hostUpdatePlayerName",
      { playerId, newName },
      (result: { success: boolean; error?: string }) => {
        resolve(result);
      }
    );
  });
}

export function sendEmojiReaction(emoji: string) {
  socket?.emit("emojiReaction", { emoji });
}
