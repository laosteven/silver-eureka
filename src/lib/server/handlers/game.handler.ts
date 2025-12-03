/**
 * Game Handler
 * Handles game flow events: question selection, answers, buzzer control, etc.
 */

import type { Server as SocketIOServer } from "socket.io";
import { SOCKET_EVENTS } from "../../constants/socket-events";
import type { GameConfig } from "../../types";
import type { GameStateService } from "../services/game-state.service";
import type { PlayerService } from "../services/player.service";

export class GameHandler {
  constructor(
    private io: SocketIOServer,
    private playerService: PlayerService,
    private gameStateService: GameStateService,
    private getGameConfig: () => GameConfig
  ) {}

  /**
   * Handle question selection
   */
  handleSelectQuestion(data: { category: string; value: number }): void {
    const gameConfig = this.getGameConfig();
    const category = gameConfig.categories.find((c) => c.name === data.category);

    if (!category) {
      console.log(`Category not found: ${data.category}`);
      return;
    }

    const question = category.questions.find((q) => q.value === data.value);
    if (!question) {
      console.log(`Question not found: ${data.category} - ${data.value}`);
      return;
    }

    // Set the question in game state
    this.gameStateService.setQuestion(question, data.category);

    // Clear buzzers and unlock for players
    this.gameStateService.clearBuzzers();
    this.gameStateService.setBuzzerLocked(false);

    // Set phase to question
    this.gameStateService.setPhase("question");

    // Hide answer initially
    this.gameStateService.setShowAnswer(false);

    console.log(`Question selected: ${data.category} - $${data.value}`);

    // Send full question (including media) to host only
    this.io.to("host").emit(SOCKET_EVENTS.FULL_QUESTION, {
      category: data.category,
      question: question.question,
      answer: question.answer,
      value: question.value,
      questionImage: question.questionImage,
      questionYoutube: question.questionYoutube,
      answerImage: question.answerImage,
      answerYoutube: question.answerYoutube,
    });
  }

  /**
   * Handle correct answer
   */
  handleCorrectAnswer(playerId: string): void {
    const player = this.playerService.getPlayer(playerId);
    const gameState = this.gameStateService.getState();

    if (!player || !gameState.currentQuestion) {
      console.log("Correct answer failed: player or question not found");
      return;
    }

    // Award points
    const points = gameState.currentQuestion.value;
    this.playerService.updatePlayerScore(playerId, player.score + points);

    // Mark question as answered
    if (gameState.currentCategory) {
      this.gameStateService.markQuestionAnswered(
        gameState.currentCategory,
        gameState.currentQuestion.value
      );
    }

    // Reset for next question
    this.gameStateService.clearCurrentQuestion();
    this.gameStateService.clearBuzzers();
    this.gameStateService.setBuzzerLocked(true);
    this.gameStateService.setPhase("playing");

    // Notify clients about correct answer (so they can play sound/animation)
    this.io.emit(SOCKET_EVENTS.CORRECT_ANSWER, { playerId, playerName: player.name, points });
    console.log(`Correct answer by ${player.name} (+${points})`);
  }

  /**
   * Handle incorrect answer
   */
  handleIncorrectAnswer(playerId: string): void {
    const player = this.playerService.getPlayer(playerId);
    const gameState = this.gameStateService.getState();

    if (!player || !gameState.currentQuestion) {
      console.log("Incorrect answer failed: player or question not found");
      return;
    }

    // Deduct points
    const points = gameState.currentQuestion.value;
    this.playerService.updatePlayerScore(playerId, player.score - points);

    // Remove player from buzzer queue
    this.gameStateService.removeBuzz(playerId);

    // Unlock buzzer for others to try
    this.gameStateService.setBuzzerLocked(false);
    console.log(`Incorrect answer by ${player.name} (-${points})`);
    // Notify clients about incorrect answer
    this.io.emit(SOCKET_EVENTS.INCORRECT_ANSWER, { playerId, playerName: player.name, points });
    console.log(`Incorrect answer by ${player.name} (-${points})`);
  }

  /**
   * Handle question cancellation (doesn't mark as answered)
   */
  handleCancelQuestion(): void {
    const gameState = this.gameStateService.getState();

    if (gameState.gamePhase !== "question") {
      return;
    }

    this.gameStateService.clearCurrentQuestion();
    this.gameStateService.clearBuzzers();
    this.gameStateService.setBuzzerLocked(true);
    this.gameStateService.setPhase("playing");

    console.log("Question cancelled");
  }

  /**
   * Handle question skip (marks as answered)
   */
  handleSkipQuestion(): void {
    const gameState = this.gameStateService.getState();

    if (gameState.currentCategory && gameState.currentQuestion) {
      this.gameStateService.markQuestionAnswered(
        gameState.currentCategory,
        gameState.currentQuestion.value
      );
    }

    this.gameStateService.clearCurrentQuestion();
    this.gameStateService.clearBuzzers();
    this.gameStateService.setBuzzerLocked(true);
    this.gameStateService.setPhase("playing");

    console.log("Question skipped");
  }

  /**
   * Handle lock buzzer
   */
  handleLockBuzzer(): void {
    this.gameStateService.setBuzzerLocked(true);
    console.log("Buzzer locked");
  }

  /**
   * Handle unlock buzzer
   */
  handleUnlockBuzzer(): void {
    this.gameStateService.setBuzzerLocked(false);
    console.log("Buzzer unlocked");
  }

  /**
   * Handle clear buzzers
   */
  handleClearBuzzers(): void {
    this.gameStateService.clearBuzzers();
    console.log("Buzzers cleared");
  }

  /**
   * Handle remove single buzz from queue (host undo accidental buzz)
   */
  handleRemoveBuzz(playerId: string): void {
    const state = this.gameStateService.getState();
    const wasFirst = state.buzzerOrder[0]?.playerId === playerId;
    this.gameStateService.removeBuzz(playerId);
    // If we removed the first buzz and buzzer was locked due to evaluation, unlock to allow others
    if (wasFirst && state.gamePhase === "question") {
      this.gameStateService.setBuzzerLocked(false);
    }
    console.log(`Removed buzz for player ${playerId}`);
  }

  /**
   * Handle reveal answer
   */
  handleRevealAnswer(): void {
    const gameState = this.gameStateService.getState();

    if (gameState.gamePhase === "question") {
      this.gameStateService.setShowAnswer(true);
      console.log("Answer revealed");
    }
  }
}
