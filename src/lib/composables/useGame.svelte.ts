/**
 * Game Composable
 * Manages game state and flow for host
 */

import { get } from "svelte/store";
import {
  startGame as socketStartGame,
  selectQuestion as socketSelectQuestion,
  correctAnswer as socketCorrectAnswer,
  incorrectAnswer as socketIncorrectAnswer,
  skipQuestion as socketSkipQuestion,
  cancelQuestion as socketCancelQuestion,
  showLeaderboard as socketShowLeaderboard,
  backToGame as socketBackToGame,
  resetGame as socketResetGame,
  lockBuzzer as socketLockBuzzer,
  unlockBuzzer as socketUnlockBuzzer,
  clearBuzzers as socketClearBuzzers,
  removeBuzz as socketRemoveBuzz,
  revealAnswer as socketRevealAnswer,
  updatePlayerScore as socketUpdatePlayerScore,
  hostUpdatePlayerName as socketHostUpdatePlayerName,
  reloadConfig as socketReloadConfig,
  gameState,
} from "$lib/stores/socket";
import type { Player } from "$lib/types";

export function useGame() {
  /**
   * Check if a question has been answered
   */
  function isQuestionAnswered(category: string, value: number): boolean {
    const state = get(gameState);
    return state.answeredQuestions.includes(`${category}-${value}`);
  }

  /**
   * Select a question if not already answered
   */
  function selectQuestion(category: string, value: number) {
    if (!isQuestionAnswered(category, value)) {
      socketSelectQuestion(category, value);
    }
  }

  /**
   * Get sorted leaderboard
   */
  function getLeaderboard(): Player[] {
    const state = get(gameState);
    return [...state.players].sort((a, b) => b.score - a.score);
  }

  /**
   * Start the game
   */
  function startGame() {
    socketStartGame();
  }

  /**
   * Reset game to lobby
   */
  function resetGame() {
    socketResetGame();
  }

  /**
   * Show leaderboard view
   */
  function showLeaderboard() {
    socketShowLeaderboard();
  }

  /**
   * Return from leaderboard to game board
   */
  function backToGame() {
    socketBackToGame();
  }

  /**
   * Mark answer as correct
   */
  function markCorrect(playerId: string) {
    socketCorrectAnswer(playerId);
  }

  /**
   * Mark answer as incorrect
   */
  function markIncorrect(playerId: string) {
    socketIncorrectAnswer(playerId);
  }

  /**
   * Skip current question
   */
  function skipQuestion() {
    socketSkipQuestion();
  }

  /**
   * Cancel current question (doesn't mark as answered)
   */
  function cancelQuestion() {
    socketCancelQuestion();
  }

  /**
   * Lock buzzer
   */
  function lockBuzzer() {
    socketLockBuzzer();
  }

  /**
   * Unlock buzzer
   */
  function unlockBuzzer() {
    socketUnlockBuzzer();
  }

  /**
   * Clear buzzer queue
   */
  function clearBuzzers() {
    socketClearBuzzers();
  }

  /**
   * Remove a single player's buzz from queue
   */
  function removeBuzz(playerId: string) {
    socketRemoveBuzz(playerId);
  }

  /**
   * Reveal answer
   */
  function revealAnswer() {
    socketRevealAnswer();
  }

  /**
   * Update player score
   */
  function updatePlayerScore(playerId: string, score: number) {
    socketUpdatePlayerScore(playerId, score);
  }

  /**
   * Update player name
   */
  async function updatePlayerName(
    playerId: string,
    newName: string
  ): Promise<{ success: boolean; error?: string }> {
    return socketHostUpdatePlayerName(playerId, newName);
  }

  /**
   * Reload game config
   */
  function reloadConfig() {
    socketReloadConfig();
  }

  return {
    isQuestionAnswered,
    selectQuestion,
    getLeaderboard,
    startGame,
    resetGame,
    showLeaderboard,
    backToGame,
    markCorrect,
    markIncorrect,
    skipQuestion,
    cancelQuestion,
    lockBuzzer,
    unlockBuzzer,
    clearBuzzers,
    removeBuzz,
    revealAnswer,
    updatePlayerScore,
    updatePlayerName,
    reloadConfig,
  };
}
