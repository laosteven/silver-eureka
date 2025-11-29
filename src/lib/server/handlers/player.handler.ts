/**
 * Player Handler
 * Handles all player-related socket events: join, rename, buzz
 */

import type { Socket } from "socket.io";
import type { PlayerService } from "../services/player.service";
import type { GameStateService } from "../services/game-state.service";
import { SOCKET_EVENTS } from "../../constants/socket-events";
import { GAME_CONSTANTS } from "../../constants/game";

interface OperationResult {
  success: boolean;
  error?: string;
}

export class PlayerHandler {
  constructor(
    private playerService: PlayerService,
    private gameStateService: GameStateService
  ) {}

  /**
   * Handle player join event
   */
  handlePlayerJoin(
    socket: Socket,
    username: string,
    callback?: (result: OperationResult) => void
  ): void {
    const cleanName = (username || "").trim();

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

    const key = cleanName.toLowerCase();

    // Check if username is taken by a connected player
    if (this.playerService.isUsernameTaken(key)) {
      console.log(
        `Player join rejected: username "${cleanName}" already taken by connected player`
      );
      callback?.({ success: false, error: "Username already taken" });
      socket.emit(SOCKET_EVENTS.JOIN_ERROR, { error: "Username already taken" });
      return;
    }

    // Check for disconnected player with same name and remove them
    const disconnectedPlayer = this.playerService.findDisconnectedPlayer(key);
    if (disconnectedPlayer) {
      console.log(
        `Removing disconnected player "${disconnectedPlayer.name}" (${disconnectedPlayer.id}) to allow new connection`
      );
      this.playerService.removePlayer(disconnectedPlayer.id);
    }

    // Add the new player
    const restoredScore = this.playerService.getStoredScore(key);
    this.playerService.addPlayer(socket.id, cleanName, restoredScore);

    socket.join("players");
    console.log(`Player joined: ${cleanName} (restored score: ${restoredScore})`);

    callback?.({ success: true });
  }

  /**
   * Handle player rename event
   */
  handlePlayerRename(
    socket: Socket,
    newUsername: string,
    callback?: (result: OperationResult) => void
  ): void {
    const player = this.playerService.getPlayer(socket.id);
    if (!player) {
      callback?.({ success: false, error: "Player not found" });
      return;
    }

    const cleanName = (newUsername || "").trim();

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
      (p) => p.id !== socket.id && p.name.toLowerCase() === newKey && p.connected
    );

    if (existingPlayer) {
      console.log(`Player rename rejected: username "${cleanName}" already taken`);
      callback?.({ success: false, error: "Username already taken" });
      return;
    }

    const oldName = player.name;

    // Update player name and handle score restoration
    const restoredScore = this.playerService.updatePlayerName(
      socket.id,
      cleanName,
      newKey !== oldKey
    );

    // Update localStorage hint for client
    socket.emit(SOCKET_EVENTS.UPDATE_USERNAME, { newUsername: cleanName });

    console.log(`Player renamed: ${oldName} -> ${cleanName} (score: ${restoredScore})`);
    callback?.({ success: true });
  }

  /**
   * Handle player buzz event
   */
  handleBuzz(socket: Socket): void {
    const gameState = this.gameStateService.getState();

    // Check if buzzer is locked
    if (gameState.buzzerLocked) {
      return;
    }

    const player = this.playerService.getPlayer(socket.id);
    if (!player) {
      return;
    }

    // Check if player already buzzed
    if (this.gameStateService.hasBuzzed(socket.id)) {
      return;
    }

    // Add buzz to the queue
    this.gameStateService.addBuzz(socket.id, player.name);
    console.log(`Player buzzed: ${player.name}`);
  }

  /**
   * Handle player disconnect event
   */
  handleDisconnect(socket: Socket): void {
    const player = this.playerService.getPlayer(socket.id);
    if (!player) {
      return;
    }

    console.log(`Player disconnected: ${player.name}`);

    // Mark as disconnected instead of removing
    this.playerService.markDisconnected(socket.id);

    // Remove from buzzer queue if present
    this.gameStateService.removeBuzz(socket.id);

    // Store their score for future reconnects
    const key = player.name.toLowerCase();
    this.playerService.getStoredScore(key); // Ensures score is persisted
  }
}
