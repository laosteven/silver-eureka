import type { Server as HTTPServer } from "http";
import { Socket, Server as SocketIOServer } from "socket.io";
import { SOCKET_EVENTS } from "../constants/socket-events";
import type { ClientGameState } from "../types";
import { loadGameConfig, watchGameConfig } from "./config";
import { GameHandler } from "./handlers/game.handler";
import { HostHandler } from "./handlers/host.handler";
import { PlayerHandler } from "./handlers/player.handler";
import { GameStateService } from "./services/game-state.service";
import { PlayerService } from "./services/player.service";

let io: SocketIOServer | null = null;
let gameConfig = loadGameConfig();

// Initialize services
const playerService = new PlayerService();
const gameStateService = new GameStateService(playerService);

// Initialize handlers (will be set after io is created)
let playerHandler: PlayerHandler;
let hostHandler: HostHandler;
let gameHandler: GameHandler;

// Watch for config changes
watchGameConfig((cfg) => {
  gameConfig = cfg;
  console.log("[socket] Config reloaded; broadcasting new config");
  broadcastConfig();
});

function getClientGameState(): ClientGameState {
  const gameState = gameStateService.getState();
  return {
    players: Array.from(gameState.players.values()),
    currentQuestion: gameState.currentQuestion,
    currentCategory: gameState.currentCategory,
    answeredQuestions: Array.from(gameState.answeredQuestions),
    buzzerOrder: gameState.buzzerOrder,
    buzzerLocked: gameState.buzzerLocked,
    gamePhase: gameState.gamePhase,
    showAnswer: gameState.showAnswer,
  };
}

function broadcastGameState() {
  if (io) {
    io.emit(SOCKET_EVENTS.GAME_STATE, getClientGameState());
  }
}

function broadcastConfig() {
  if (io) {
    io.emit(SOCKET_EVENTS.GAME_CONFIG, {
      title: gameConfig.title,
      countdown: gameConfig.countdown,
      categories: gameConfig.categories.map((cat) => ({
        name: cat.name,
        questions: cat.questions.map((q) => ({ value: q.value })),
      })),
    });
  }
}

export function initSocketServer(server: HTTPServer) {
  if (io) return io;

  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Initialize handlers now that io is created
  playerHandler = new PlayerHandler(playerService, gameStateService);
  hostHandler = new HostHandler(io, playerService, gameStateService, () => gameConfig);
  gameHandler = new GameHandler(io, playerService, gameStateService, () => gameConfig);

  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id);

    // Send current config and state to new connection
    socket.emit(SOCKET_EVENTS.GAME_CONFIG, {
      title: gameConfig.title,
      countdown: gameConfig.countdown,
      categories: gameConfig.categories.map((cat) => ({
        name: cat.name,
        questions: cat.questions.map((q) => ({ value: q.value })),
      })),
    });
    socket.emit(SOCKET_EVENTS.GAME_STATE, getClientGameState());

    // Host joins
    socket.on(SOCKET_EVENTS.HOST_JOIN, () => {
      hostHandler.handleHostJoin(socket);
      broadcastGameState();
    });

    // Manual config reload (host only)
    socket.on(SOCKET_EVENTS.RELOAD_CONFIG, () => {
      hostHandler.handleReloadConfig(socket, () => {
        gameConfig = loadGameConfig();
        return gameConfig;
      });
    });

    // Player joins with username
    socket.on(
      SOCKET_EVENTS.PLAYER_JOIN,
      (username: string, callback?: (result: { success: boolean; error?: string }) => void) => {
        playerHandler.handlePlayerJoin(socket, username, callback);
        broadcastGameState();
      }
    );

    // Player renames themselves
    socket.on(
      SOCKET_EVENTS.PLAYER_RENAME,
      (newUsername: string, callback?: (result: { success: boolean; error?: string }) => void) => {
        playerHandler.handlePlayerRename(socket, newUsername, callback);
        broadcastGameState();
      }
    );

    // Host starts the game
    socket.on(SOCKET_EVENTS.START_GAME, () => {
      hostHandler.handleStartGame();
      broadcastGameState();
    });

    // Host selects a question
    socket.on(SOCKET_EVENTS.SELECT_QUESTION, (data: { category: string; value: number }) => {
      gameHandler.handleSelectQuestion(data);
      broadcastGameState();
    });

    // Player buzzes
    socket.on(SOCKET_EVENTS.BUZZ, () => {
      playerHandler.handleBuzz(socket);
      // Emit a discrete buzzer sound event so clients can play audio
      try {
        const p = playerService.getPlayer(socket.id);
        if (p) {
          io?.emit(SOCKET_EVENTS.BUZZER_SOUND, { playerName: p.name });
        }
      } catch (e) {
        console.warn("[socket] Failed to emit buzzer sound", e);
      }
      broadcastGameState();
    });

    // Host locks buzzer
    socket.on(SOCKET_EVENTS.LOCK_BUZZER, () => {
      gameHandler.handleLockBuzzer();
      broadcastGameState();
    });

    // Host unlocks buzzer
    socket.on(SOCKET_EVENTS.UNLOCK_BUZZER, () => {
      gameHandler.handleUnlockBuzzer();
      broadcastGameState();
    });

    // Host clears buzzer queue
    socket.on(SOCKET_EVENTS.CLEAR_BUZZERS, () => {
      gameHandler.handleClearBuzzers();
      broadcastGameState();
    });

    // Host removes single buzz from queue
    socket.on(SOCKET_EVENTS.REMOVE_BUZZ, (playerId: string) => {
      gameHandler.handleRemoveBuzz(playerId);
      broadcastGameState();
    });

    // Host marks answer correct
    socket.on(SOCKET_EVENTS.CORRECT_ANSWER, (playerId: string) => {
      gameHandler.handleCorrectAnswer(playerId);
      broadcastGameState();
    });

    // Host marks answer incorrect
    socket.on(SOCKET_EVENTS.INCORRECT_ANSWER, (playerId: string) => {
      gameHandler.handleIncorrectAnswer(playerId);
      broadcastGameState();
    });

    // Host cancels an accidentally selected question (does NOT mark answered)
    socket.on(SOCKET_EVENTS.CANCEL_QUESTION, () => {
      gameHandler.handleCancelQuestion();
      broadcastGameState();
    });

    // Host skips question
    socket.on(SOCKET_EVENTS.SKIP_QUESTION, () => {
      gameHandler.handleSkipQuestion();
      broadcastGameState();
    });

    // Host shows leaderboard
    socket.on(SOCKET_EVENTS.SHOW_LEADERBOARD, () => {
      hostHandler.handleShowLeaderboard();
      broadcastGameState();
    });

    // Host returns from leaderboard to game board
    socket.on(SOCKET_EVENTS.BACK_TO_GAME, () => {
      hostHandler.handleBackToGame();
      broadcastGameState();
    });

    // Host resets game
    socket.on(SOCKET_EVENTS.RESET_GAME, () => {
      hostHandler.handleResetGame();
      broadcastGameState();
    });

    // Host clears all players
    socket.on(SOCKET_EVENTS.CLEAR_PLAYERS, () => {
      hostHandler.handleClearPlayers();
      broadcastGameState();
    });

    // Host removes a single player
    socket.on(SOCKET_EVENTS.REMOVE_PLAYER, (playerId: string) => {
      hostHandler.handleRemovePlayer(playerId);
      broadcastGameState();
    });

    // Host clears only disconnected players
    socket.on(SOCKET_EVENTS.CLEAR_DISCONNECTED, () => {
      hostHandler.handleClearDisconnected();
      broadcastGameState();
    });

    // Host reveals answer (sets showAnswer true)
    socket.on(SOCKET_EVENTS.REVEAL_ANSWER, () => {
      gameHandler.handleRevealAnswer();
      broadcastGameState();
    });

    // Host manually updates a player's score
    socket.on(SOCKET_EVENTS.UPDATE_PLAYER_SCORE, (data: { playerId: string; newScore: number }) => {
      hostHandler.handleUpdatePlayerScore(socket, data);
      broadcastGameState();
    });

    // Host manually updates a player's name
    socket.on(
      SOCKET_EVENTS.HOST_UPDATE_PLAYER_NAME,
      (
        data: { playerId: string; newName: string },
        callback?: (result: { success: boolean; error?: string }) => void
      ) => {
        hostHandler.handleUpdatePlayerName(socket, data, callback);
        broadcastGameState();
      }
    );

    // Disconnect handling
    socket.on("disconnect", () => {
      playerHandler.handleDisconnect(socket);
      broadcastGameState();
    });
  });

  return io;
}

export function getIO() {
  return io;
}
