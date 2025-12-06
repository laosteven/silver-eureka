export interface GameConfig {
  title: string;
  categories: Category[];
  emoji?: {
    cost?: number;
    allowNegative?: boolean;
    maxActive?: number;
    cooldownMs?: number;
    displayDurationMs?: number;
  };
  typewriter?: {
    enabled?: boolean;
    speedMsPerChar?: number;
    delayBeforeMediaMs?: number;
  };
}

export interface Category {
  name: string;
  questions: Question[];
}

export interface Question {
  value: number;
  question: string;
  answer: string;
  questionImage?: string;
  questionYoutube?: string;
  answerImage?: string;
  answerYoutube?: string;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  connected: boolean;
}

export interface BuzzEvent {
  playerId: string;
  playerName: string;
  timestamp: number;
}

export type GamePhase = "lobby" | "playing" | "question" | "answer" | "scoring" | "leaderboard";

export interface GameState {
  players: Map<string, Player>;
  currentQuestion: Question | null;
  currentCategory: string | null;
  answeredQuestions: Set<string>;
  buzzerOrder: BuzzEvent[];
  buzzerLocked: boolean;
  gamePhase: GamePhase;
  hostConnected: boolean;
  showAnswer: boolean;
  scoringEnabled?: boolean;
}

export interface ClientGameState {
  players: Player[];
  currentQuestion: Question | null;
  currentCategory: string | null;
  answeredQuestions: string[];
  buzzerOrder: BuzzEvent[];
  buzzerLocked: boolean;
  gamePhase: GamePhase;
  showAnswer: boolean;
  scoringEnabled?: boolean;
}

export interface GameConfigClient {
  title: string;
  categories: {
    name: string;
    questions: { value: number }[];
  }[];
  emoji?: {
    cost?: number;
    allowNegative?: boolean;
    maxActive?: number;
    cooldownMs?: number;
    displayDurationMs?: number;
  };
}

export interface FullQuestion {
  category: string;
  question: string;
  answer: string;
  value: number;
  questionImage?: string;
  questionYoutube?: string;
  answerImage?: string;
  answerYoutube?: string;
}
