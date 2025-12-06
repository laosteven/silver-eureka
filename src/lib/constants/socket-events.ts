/**
 * Socket event names for type-safe event emission
 */

export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: "connect",
  DISCONNECT: "disconnect",

  // Host events
  HOST_JOIN: "hostJoin",
  START_GAME: "startGame",
  SELECT_QUESTION: "selectQuestion",
  REVEAL_ANSWER: "revealAnswer",
  CORRECT_ANSWER: "correctAnswer",
  INCORRECT_ANSWER: "incorrectAnswer",
  SKIP_QUESTION: "skipQuestion",
  CANCEL_QUESTION: "cancelQuestion",
  SHOW_LEADERBOARD: "showLeaderboard",
  BACK_TO_GAME: "backToGame",
  RESET_GAME: "resetGame",
  RELOAD_CONFIG: "reloadConfig",
  UPDATE_PLAYER_SCORE: "updatePlayerScore",
  HOST_UPDATE_PLAYER_NAME: "hostUpdatePlayerName",
  CLEAR_PLAYERS: "clearPlayers",
  REMOVE_PLAYER: "removePlayer",
  CLEAR_DISCONNECTED: "clearDisconnected",

  // Player events
  PLAYER_JOIN: "playerJoin",
  PLAYER_RENAME: "playerRename",
  BUZZ: "buzz",
  EMOJI_REACTION: "emojiReaction",
  EMOJI_STATUS: "emojiStatus",

  // Buzzer control events
  LOCK_BUZZER: "lockBuzzer",
  UNLOCK_BUZZER: "unlockBuzzer",
  CLEAR_BUZZERS: "clearBuzzers",
  REMOVE_BUZZ: "removeBuzz",

  // State broadcast events
  GAME_STATE: "gameState",
  GAME_CONFIG: "gameConfig",
  HOST_CONFIRMED: "hostConfirmed",
  HOST_LEFT: "hostLeft",
  FULL_QUESTION: "fullQuestion",
  BUZZER_SOUND: "buzzerSound",
  UPDATE_USERNAME: "updateUsername",
  HOST_NOTIFICATION: "hostNotification",
  JOIN_ERROR: "joinError",
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
