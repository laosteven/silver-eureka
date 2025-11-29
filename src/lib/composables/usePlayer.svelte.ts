/**
 * Player Composable
 * Manages player state, joining, renaming, and buzzing
 */

import { browser } from "$app/environment";
import type { ClientGameState } from "$lib/types";
import {
  playerJoin as socketPlayerJoin,
  playerRename as socketPlayerRename,
  buzz as socketBuzz,
  gameState,
  playerId,
  joinError,
  updatedUsername,
} from "$lib/stores/socket";
import type { Player } from "$lib/types";
import { validateUsername } from "$lib/utils/validation";

const STORAGE_KEY = "jeopardy-game_username";

export function usePlayer() {
  let hasJoined = $state(false);
  let username = $state("");
  let buzzed = $state(false);

  // Subscribe to stores for reactivity
  let currentGameState = $state<ClientGameState & { showAnswer?: boolean }>({
    players: [],
    currentQuestion: null,
    currentCategory: null,
    answeredQuestions: [],
    buzzerOrder: [],
    buzzerLocked: true,
    gamePhase: "lobby",
    showAnswer: false,
  });
  let currentPlayerId = $state("");

  // Use $effect to keep local state in sync with stores
  $effect(() => {
    const unsubState = gameState.subscribe((v) => (currentGameState = v));
    const unsubId = playerId.subscribe((v) => (currentPlayerId = v));
    const unsubUpdatedName = updatedUsername.subscribe((val) => {
      if (val) {
        username = val;
        if (browser) localStorage.setItem(STORAGE_KEY, val);
      }
    });
    return () => {
      unsubState();
      unsubId();
      unsubUpdatedName();
    };
  });

  /**
   * Initialize player state from localStorage
   */
  function init() {
    if (browser) {
      const savedUsername = localStorage.getItem(STORAGE_KEY);
      if (savedUsername) {
        username = savedUsername;
      }
    }
  }

  /**
   * Join the game with username
   */
  async function join(name: string): Promise<{ success: boolean; error?: string }> {
    const { valid, error } = validateUsername(name);
    if (!valid) return { success: false, error };
    const trimmedName = name.trim();

    joinError.set(null);
    const result = await socketPlayerJoin(trimmedName);

    if (result.success) {
      if (browser) {
        localStorage.setItem(STORAGE_KEY, trimmedName);
      }
      username = trimmedName;
      hasJoined = true;
    }

    return result;
  }

  /**
   * Rename player
   */
  async function rename(newName: string): Promise<{ success: boolean; error?: string }> {
    const { valid, error } = validateUsername(newName);
    if (!valid) return { success: false, error };
    const trimmedName = newName.trim();

    const result = await socketPlayerRename(trimmedName);

    if (result.success) {
      if (browser) {
        localStorage.setItem(STORAGE_KEY, trimmedName);
      }
      username = trimmedName;
    }

    return result;
  }

  /**
   * Buzz in for current question
   */
  function doBuzz() {
    socketBuzz();
    buzzed = true;
  }

  /**
   * Reset buzz state (when question changes)
   */
  function resetBuzz() {
    buzzed = false;
  }

  /**
   * Get current player from game state (reactive)
   */
  const currentPlayer = $derived(
    currentGameState.players?.find((p: Player) => p.id === currentPlayerId)
  );

  /**
   * Get player rank in leaderboard (reactive)
   */
  const playerRank = $derived.by(() => {
    if (!currentGameState.players || !currentPlayerId) return 0;
    const sorted = [...currentGameState.players].sort((a: Player, b: Player) => b.score - a.score);
    const index = sorted.findIndex((p: Player) => p.id === currentPlayerId);
    return index + 1;
  });

  /**
   * Check if current player has buzzed (reactive)
   */
  const hasBuzzedValue = $derived(
    currentGameState.buzzerOrder?.some((b) => b.playerId === currentPlayerId) ?? false
  );

  /**
   * Get buzz position in queue (reactive)
   */
  const buzzPosition = $derived.by(() => {
    if (!currentGameState.buzzerOrder) return 0;
    const index = currentGameState.buzzerOrder.findIndex(
      (b) => b.playerId === currentPlayerId
    );
    return index + 1;
  });

  return {
    get hasJoined() {
      return hasJoined;
    },
    get username() {
      return username;
    },
    set username(value: string) {
      username = value;
    },
    get buzzed() {
      return buzzed;
    },
    get currentPlayer() {
      return currentPlayer;
    },
    get playerRank() {
      return playerRank;
    },
    get hasBuzzedValue() {
      return hasBuzzedValue;
    },
    get buzzPosition() {
      return buzzPosition;
    },
    init,
    join,
    rename,
    doBuzz,
    resetBuzz,
  };
}
