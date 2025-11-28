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
	image?: string;
	youtube?: string;
}

let socket: Socket | null = null;

export const connected = writable(false);
export const gameState = writable<ClientGameState & { showAnswer?: boolean }>({
	players: [],
	currentQuestion: null,
	currentCategory: null,
	answeredQuestions: [],
	buzzerOrder: [],
	buzzerLocked: true,
	gamePhase: 'lobby',
	showAnswer: false
});
export const gameConfig = writable<GameConfigClient>({
	title: '',
	countdown: 30,
	categories: []
});
export const fullQuestion = writable<FullQuestion | null>(null);
export const playerId = writable<string>('');
export const buzzerSound = writable<{ playerName: string } | null>(null);
export const joinError = writable<string | null>(null);

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

	socket.on('gameState', (state: ClientGameState & { showAnswer?: boolean }) => {
		gameState.set(state);
	});

	socket.on('gameConfig', (config: GameConfigClient) => {
		gameConfig.set(config);
	});

	socket.on('fullQuestion', (question: FullQuestion) => {
		fullQuestion.set(question);
	});

	socket.on('buzzerSound', (data: { playerName: string }) => {
		buzzerSound.set(data);
		// Clear after a short delay
		setTimeout(() => buzzerSound.set(null), 100);
	});

	socket.on('joinError', (data: { error: string }) => {
		joinError.set(data.error);
	});

	return socket;
}

export function getSocket() {
	return socket;
}

export function hostJoin() {
	socket?.emit('hostJoin');
}

export function playerJoin(username: string): Promise<{ success: boolean; error?: string }> {
	return new Promise((resolve) => {
		if (!socket) {
			resolve({ success: false, error: 'Not connected' });
			return;
		}
		socket.emit('playerJoin', username, (result: { success: boolean; error?: string }) => {
			if (!result.success) {
				joinError.set(result.error || 'Failed to join');
			}
			resolve(result);
		});
	});
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

export function revealAnswer() {
	socket?.emit('revealAnswer');
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

export function cancelQuestion() {
	socket?.emit('cancelQuestion');
	fullQuestion.set(null);
}

export function showLeaderboard() {
	socket?.emit('showLeaderboard');
	fullQuestion.set(null);
}

export function backToGame() {
	socket?.emit('backToGame');
}

export function resetGame() {
	socket?.emit('resetGame');
	fullQuestion.set(null);
}

export function reloadConfig() {
	socket?.emit('reloadConfig');
}

export function updatePlayerScore(playerId: string, newScore: number) {
	socket?.emit('updatePlayerScore', { playerId, newScore });
}
