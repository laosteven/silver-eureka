import { writable } from 'svelte/store';
import { io, type Socket } from 'socket.io-client';
import type { ClientGameState } from '$lib/types';

interface GameConfigClient {
	title: string;
	countdown: number;
	categories: {
		name: string;
		questions: { value: number }[];
	}[];
}

interface FullQuestion {
	category: string;
	question: string;
	answer: string;
	value: number;
}

let socket: Socket | null = null;

export const connected = writable(false);
export const gameState = writable<ClientGameState>({
	players: [],
	currentQuestion: null,
	currentCategory: null,
	answeredQuestions: [],
	buzzerOrder: [],
	buzzerLocked: true,
	gamePhase: 'lobby'
});
export const gameConfig = writable<GameConfigClient>({
	title: 'Jeopardy!',
	countdown: 30,
	categories: []
});
export const fullQuestion = writable<FullQuestion | null>(null);
export const playerId = writable<string>('');

export function initSocket() {
	if (socket) return socket;

	// Only initialize socket on the client side
	if (typeof window === 'undefined') {
		return null;
	}

	socket = io(window.location.origin);

	socket.on('connect', () => {
		connected.set(true);
		playerId.set(socket?.id || '');
	});

	socket.on('disconnect', () => {
		connected.set(false);
	});

	socket.on('gameState', (state: ClientGameState) => {
		gameState.set(state);
	});

	socket.on('gameConfig', (config: GameConfigClient) => {
		gameConfig.set(config);
	});

	socket.on('fullQuestion', (question: FullQuestion) => {
		fullQuestion.set(question);
	});

	return socket;
}

export function getSocket() {
	return socket;
}

export function hostJoin() {
	socket?.emit('hostJoin');
}

export function playerJoin(username: string) {
	socket?.emit('playerJoin', username);
}

export function startGame() {
	socket?.emit('startGame');
}

export function selectQuestion(category: string, value: number) {
	socket?.emit('selectQuestion', { category, value });
}

export function buzz() {
	socket?.emit('buzz');
}

export function lockBuzzer() {
	socket?.emit('lockBuzzer');
}

export function unlockBuzzer() {
	socket?.emit('unlockBuzzer');
}

export function clearBuzzers() {
	socket?.emit('clearBuzzers');
}

export function correctAnswer(targetPlayerId: string) {
	socket?.emit('correctAnswer', targetPlayerId);
	fullQuestion.set(null);
}

export function incorrectAnswer(targetPlayerId: string) {
	socket?.emit('incorrectAnswer', targetPlayerId);
}

export function skipQuestion() {
	socket?.emit('skipQuestion');
	fullQuestion.set(null);
}

export function showLeaderboard() {
	socket?.emit('showLeaderboard');
	fullQuestion.set(null);
}

export function resetGame() {
	socket?.emit('resetGame');
	fullQuestion.set(null);
}
