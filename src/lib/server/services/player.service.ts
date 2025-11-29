/**
 * Player Management Service
 * Handles all player-related business logic
 */

import type { Player } from "../../types";

export class PlayerService {
  private players: Map<string, Player>;
  private playerScores: Map<string, number>;

  constructor() {
    this.players = new Map();
    this.playerScores = new Map();
  }

  /**
   * Add a new player to the game
   */
  addPlayer(id: string, name: string, score?: number): Player {
    const cleanName = name.trim();
    const key = cleanName.toLowerCase();
    const restoredScore = score ?? this.playerScores.get(key) ?? 0;

    const player: Player = {
      id,
      name: cleanName,
      score: restoredScore,
      connected: true,
    };

    this.players.set(id, player);
    this.playerScores.set(key, restoredScore);

    return player;
  }

  /**
   * Check if a username is taken by a connected player
   */
  isUsernameTaken(username: string, excludeId?: string): boolean {
    const key = username.toLowerCase();
    return Array.from(this.players.values()).some(
      (p) => p.name.toLowerCase() === key && p.connected && p.id !== excludeId
    );
  }

  /**
   * Find disconnected player by username
   */
  findDisconnectedPlayer(username: string): Player | undefined {
    const key = username.toLowerCase();
    const entry = Array.from(this.players.entries()).find(
      ([, p]) => p.name.toLowerCase() === key && !p.connected
    );
    return entry ? entry[1] : undefined;
  }

  /**
   * Get player by ID
   */
  getPlayer(id: string): Player | undefined {
    return this.players.get(id);
  }

  /**
   * Get all players as array
   */
  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  /**
   * Remove player by ID
   */
  removePlayer(id: string): boolean {
    return this.players.delete(id);
  }

  /**
   * Update player name and optionally restore score
   * @param restoreScore - If true, will restore score from new username if available
   * @returns The final score after update
   */
  updatePlayerName(id: string, newName: string, restoreScore: boolean = false): number {
    const player = this.players.get(id);
    if (!player) return 0;

    const oldKey = player.name.toLowerCase();
    const newKey = newName.toLowerCase();
    const currentScore = player.score;

    player.name = newName;

    if (oldKey !== newKey) {
      if (restoreScore) {
        // Restore score from new username if it exists
        const restoredScore = this.playerScores.get(newKey) ?? currentScore;
        player.score = restoredScore;
        this.playerScores.set(newKey, restoredScore);
      } else {
        this.playerScores.set(newKey, currentScore);
      }
      // Keep old name's score in case they want to switch back
      this.playerScores.set(oldKey, currentScore);
    }

    return player.score;
  }

  /**
   * Update player score
   */
  updatePlayerScore(id: string, newScore: number): boolean {
    const player = this.players.get(id);
    if (!player) return false;

    player.score = newScore;
    this.playerScores.set(player.name.toLowerCase(), newScore);

    return true;
  }

  /**
   * Mark player as disconnected
   */
  markDisconnected(id: string): boolean {
    const player = this.players.get(id);
    if (!player) return false;

    player.connected = false;
    this.playerScores.set(player.name.toLowerCase(), player.score);

    return true;
  }

  /**
   * Reset all player scores
   */
  resetAllScores(): void {
    this.players.forEach((player) => {
      player.score = 0;
      this.playerScores.set(player.name.toLowerCase(), 0);
    });
  }

  /**
   * Get stored score for a username
   */
  getStoredScore(username: string): number {
    return this.playerScores.get(username.toLowerCase()) ?? 0;
  }
}
