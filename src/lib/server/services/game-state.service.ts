/**
 * Game State Service
 * Manages the core game state and logic
 */

import type { GameState, Question, BuzzEvent, GamePhase } from "../../types";
import { PlayerService } from "./player.service";

export class GameStateService {
  private state: GameState;
  private playerService: PlayerService;

  constructor(playerService: PlayerService) {
    this.playerService = playerService;
    this.state = {
      players: new Map(),
      currentQuestion: null,
      currentCategory: null,
      answeredQuestions: new Set(),
      buzzerOrder: [],
      buzzerLocked: true,
      gamePhase: "lobby",
      hostConnected: false,
      showAnswer: false,
    };
  }

  /**
   * Get current game state
   */
  getState(): GameState {
    // Update players reference from player service
    this.state.players = new Map(this.playerService.getAllPlayers().map((p) => [p.id, p]));
    return this.state;
  }

  /**
   * Set game phase
   */
  setPhase(phase: GamePhase): void {
    this.state.gamePhase = phase;
  }

  /**
   * Set current question
   */
  setQuestion(question: Question | null, category: string | null): void {
    this.state.currentQuestion = question;
    this.state.currentCategory = category;
  }

  /**
   * Mark question as answered
   */
  markQuestionAnswered(category: string, value: number): void {
    const key = `${category}-${value}`;
    this.state.answeredQuestions.add(key);
  }

  /**
   * Check if question is answered
   */
  isQuestionAnswered(category: string, value: number): boolean {
    return this.state.answeredQuestions.has(`${category}-${value}`);
  }

  /**
   * Add buzz event
   */
  addBuzz(playerId: string, playerName: string): void {
    const buzzEvent: BuzzEvent = {
      playerId,
      playerName,
      timestamp: Date.now(),
    };
    this.state.buzzerOrder.push(buzzEvent);
  }

  /**
   * Check if player has buzzed
   */
  hasBuzzed(playerId: string): boolean {
    return this.state.buzzerOrder.some((b) => b.playerId === playerId);
  }

  /**
   * Remove player from buzzer queue
   */
  removeBuzz(playerId: string): void {
    this.state.buzzerOrder = this.state.buzzerOrder.filter((b) => b.playerId !== playerId);
  }

  /**
   * Clear all buzzers
   */
  clearBuzzers(): void {
    this.state.buzzerOrder = [];
  }

  /**
   * Lock/unlock buzzer
   */
  setBuzzerLocked(locked: boolean): void {
    this.state.buzzerLocked = locked;
  }

  /**
   * Set answer visibility
   */
  setShowAnswer(show: boolean): void {
    this.state.showAnswer = show;
  }

  /**
   * Update buzzer order player name (for when player renames)
   */
  updateBuzzerPlayerName(playerId: string, newName: string): void {
    this.state.buzzerOrder = this.state.buzzerOrder.map((b) =>
      b.playerId === playerId ? { ...b, playerName: newName } : b
    );
  }

  /**
   * Reset game state for new game
   */
  reset(): void {
    this.state.answeredQuestions.clear();
    this.state.currentQuestion = null;
    this.state.currentCategory = null;
    this.state.buzzerOrder = [];
    this.state.buzzerLocked = true;
    this.state.gamePhase = "lobby";
    this.state.showAnswer = false;
  }

  /**
   * Clear current question data
   */
  clearCurrentQuestion(): void {
    this.state.currentQuestion = null;
    this.state.currentCategory = null;
    this.state.showAnswer = false;
  }
}
