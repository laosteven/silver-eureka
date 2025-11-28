export interface GameConfig {
	title: string;
	countdown: number;
	categories: Category[];
}

export interface Category {
	name: string;
	questions: Question[];
}

export interface Question {
	value: number;
	question: string;
	answer: string;
	image?: string;
	youtube?: string;
}

export interface Player {
	id: string;
	name: string;
	score: number;
}

export interface BuzzEvent {
	playerId: string;
	playerName: string;
	timestamp: number;
}

export interface GameState {
	players: Map<string, Player>;
	currentQuestion: Question | null;
	currentCategory: string | null;
	answeredQuestions: Set<string>;
	buzzerOrder: BuzzEvent[];
	buzzerLocked: boolean;
	gamePhase: 'lobby' | 'playing' | 'question' | 'answer' | 'leaderboard';
	hostConnected: boolean;
}

export interface ClientGameState {
	players: Player[];
	currentQuestion: Question | null;
	currentCategory: string | null;
	answeredQuestions: string[];
	buzzerOrder: BuzzEvent[];
	buzzerLocked: boolean;
	gamePhase: 'lobby' | 'playing' | 'question' | 'answer' | 'leaderboard';
}
