/**
 * Host Handler
 * Handles all host-related socket events: join, start game, score/name updates, etc.
 */

import type { Server as SocketIOServer, Socket } from "socket.io";
import type { PlayerService } from "../services/player.service";
import type { GameStateService } from "../services/game-state.service";
import type { GameConfig } from "../../types";
import { SOCKET_EVENTS } from "../../constants/socket-events";
import { GAME_CONSTANTS } from "../../constants/game";

interface OperationResult {
  success: boolean;
  error?: string;
}

export class HostHandler {
  constructor(
    private io: SocketIOServer,
    private playerService: PlayerService,
    private gameStateService: GameStateService,
    private getGameConfig: () => GameConfig
  ) {}

  /**
   * Handle host join event
   */
  handleHostJoin(socket: Socket): void {
    socket.join("host");
    const gameState = this.gameStateService.getState();
    gameState.hostConnected = true;
    console.log("Host connected");
  }

  /**
   * Handle game start
   */
  handleStartGame(): void {
    // Reset game state (clears questions, buzzers, etc.)
    this.gameStateService.reset();

    // Reset all player scores
    this.playerService.resetAllScores();

    // Set phase to playing (must be AFTER reset since reset sets to lobby)
    this.gameStateService.setPhase("playing");

    console.log("Game started");
  }

  /**
   * Handle game reset
   */
  handleResetGame(): void {
    // Reset all scores
    this.playerService.resetAllScores();

    // Reset game state
    this.gameStateService.reset();
    this.gameStateService.setPhase("lobby");

    console.log("Game reset");
  }

  /**
   * Handle show leaderboard
   */
  handleShowLeaderboard(): void {
    this.gameStateService.setPhase("leaderboard");
    this.gameStateService.clearCurrentQuestion();
  }

  /**
   * Handle back to game from leaderboard
   */
  handleBackToGame(): void {
    const gameState = this.gameStateService.getState();
    if (gameState.gamePhase === "leaderboard") {
      this.gameStateService.setPhase("playing");
    }
  }

  /**
   * Handle manual player score update by host
   */
  handleUpdatePlayerScore(socket: Socket, data: { playerId: string; newScore: number }): void {
    // Verify host permission
    if (!socket.rooms.has("host")) {
      console.log("Unauthorized score update attempt");
      return;
    }

    const player = this.playerService.getPlayer(data.playerId);
    if (!player) {
      console.log(`Score update failed: player ${data.playerId} not found`);
      return;
    }

    const oldScore = player.score;
    this.playerService.updatePlayerScore(data.playerId, data.newScore);

    console.log(`Host updated ${player.name}'s score to ${data.newScore}`);

    // Notify the player
    const scoreDiff = data.newScore - oldScore;
    const diffSign = scoreDiff >= 0 ? "+" : "";
    this.io.to(data.playerId).emit(SOCKET_EVENTS.HOST_NOTIFICATION, {
      message: `Host updated your score: $${oldScore} → $${data.newScore} (${diffSign}${scoreDiff})`,
    });
  }

  /**
   * Handle manual player name update by host
   */
  handleUpdatePlayerName(
    socket: Socket,
    data: { playerId: string; newName: string },
    callback?: (result: OperationResult) => void
  ): void {
    // Verify host permission
    if (!socket.rooms.has("host")) {
      callback?.({ success: false, error: "Only host can update names" });
      return;
    }

    const player = this.playerService.getPlayer(data.playerId);
    if (!player) {
      callback?.({ success: false, error: "Player not found" });
      return;
    }

    const cleanName = (data.newName || "").trim();

    // Validate username
    if (!cleanName) {
      callback?.({ success: false, error: "Username cannot be empty" });
      return;
    }

    if (cleanName.length > GAME_CONSTANTS.MAX_USERNAME_LENGTH) {
      callback?.({
        success: false,
        error: `Username cannot exceed ${GAME_CONSTANTS.MAX_USERNAME_LENGTH} characters`,
      });
      return;
    }

    const newKey = cleanName.toLowerCase();
    const oldKey = player.name.toLowerCase();

    // Check if new username is taken by another active player
    const allPlayers = this.playerService.getAllPlayers();
    const existingPlayer = allPlayers.find(
      (p) => p.id !== data.playerId && p.name.toLowerCase() === newKey
    );

    if (existingPlayer) {
      console.log(`Host name update rejected: username "${cleanName}" already taken`);
      callback?.({ success: false, error: "Username already taken" });
      return;
    }

    const oldName = player.name;

    // Update player name
    this.playerService.updatePlayerName(data.playerId, cleanName, newKey !== oldKey);

    // Update buzzer order if player is in it
    this.gameStateService.updateBuzzerPlayerName(data.playerId, cleanName);

    // Notify the player's client to update localStorage
    this.io.to(data.playerId).emit(SOCKET_EVENTS.UPDATE_USERNAME, {
      newUsername: cleanName,
    });

    // Notify the player about the name change
    this.io.to(data.playerId).emit(SOCKET_EVENTS.HOST_NOTIFICATION, {
      message: `Host updated your name: "${oldName}" → "${cleanName}"`,
    });

    console.log(`Host updated player name: ${oldName} -> ${cleanName}`);
    callback?.({ success: true });
  }

  /**
   * Handle manual config reload
   */
  handleReloadConfig(socket: Socket, reloadConfigFn: () => GameConfig): void {
    // Verify host permission
    if (!socket.rooms.has("host")) {
      console.log("Unauthorized config reload attempt");
      return;
    }

    const newConfig = reloadConfigFn();
    console.log("[socket] Manual config reload triggered");

    // Broadcast new config
    this.broadcastConfig(newConfig);
  }

  /**
   * Broadcast game config to all clients
   */
  broadcastConfig(config: GameConfig): void {
    this.io.emit(SOCKET_EVENTS.GAME_CONFIG, {
      title: config.title,
      countdown: config.countdown,
      categories: config.categories.map((cat) => ({
        name: cat.name,
        questions: cat.questions.map((q) => ({ value: q.value })),
      })),
    });
  }
}
