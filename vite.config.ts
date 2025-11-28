import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import { Server } from 'socket.io';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	
	return {
		plugins: [
			tailwindcss(),
			sveltekit(),
			{
				name: 'socket-io',
				configureServer(server) {
					if (!server.httpServer) return;
					
					const io = new Server(server.httpServer);
					
					// Game state
					const players = new Map();
					const playersByName = new Map(); // Track players by name for session restoration
					let currentQuestion: { value: number; question: string; answer: string; image?: string; youtube?: string } | null = null;
					let currentCategory: string | null = null;
					const answeredQuestions = new Set();
					let buzzerOrder: { playerId: string; playerName: string; timestamp: number }[] = [];
					let buzzerLocked = true;
					let gamePhase: 'lobby' | 'playing' | 'question' | 'answer' | 'leaderboard' = 'lobby';
					let showAnswer = false;

					const defaultCategories = [
						{
							name: 'Science',
							questions: [
								{ value: 100, question: 'This planet is known as the Red Planet', answer: 'What is Mars?' },
								{ value: 200, question: 'This force keeps us on the ground', answer: 'What is gravity?' },
								{ value: 300, question: 'H2O is the chemical formula for this', answer: 'What is water?' },
								{ value: 400, question: 'This organ pumps blood through the body', answer: 'What is the heart?' },
								{ value: 500, question: 'This scientist developed the theory of relativity', answer: 'Who is Albert Einstein?' }
							]
						},
						{
							name: 'History',
							questions: [
								{ value: 100, question: 'This document declared American independence in 1776', answer: 'What is the Declaration of Independence?' },
								{ value: 200, question: 'This wall fell in 1989', answer: 'What is the Berlin Wall?' },
								{ value: 300, question: 'This ship sank on its maiden voyage in 1912', answer: 'What is the Titanic?' },
								{ value: 400, question: 'This ancient wonder was located in Egypt', answer: 'What are the Pyramids of Giza?' },
								{ value: 500, question: 'This explorer is credited with discovering America', answer: 'Who is Christopher Columbus?' }
							]
						},
						{
							name: 'Geography',
							questions: [
								{ value: 100, question: 'This is the largest ocean on Earth', answer: 'What is the Pacific Ocean?' },
								{ value: 200, question: 'This river is the longest in the world', answer: 'What is the Nile River?' },
								{ value: 300, question: 'This country has the largest population', answer: 'What is China?' },
								{ value: 400, question: 'This is the tallest mountain in the world', answer: 'What is Mount Everest?' },
								{ value: 500, question: 'This desert is the largest hot desert in the world', answer: 'What is the Sahara Desert?' }
							]
						},
						{
							name: 'Pop Culture',
							questions: [
								{ value: 100, question: 'This wizard attends Hogwarts School', answer: 'Who is Harry Potter?' },
								{ value: 200, question: 'This superhero is known as the Dark Knight', answer: 'Who is Batman?' },
								{ value: 300, question: 'This band sang "Bohemian Rhapsody"', answer: 'Who is Queen?' },
								{ value: 400, question: 'This movie features a time-traveling DeLorean', answer: 'What is Back to the Future?' },
								{ value: 500, question: 'This streaming service has a red "N" logo', answer: 'What is Netflix?' }
							]
						},
						{
							name: 'Sports',
							questions: [
								{ value: 100, question: 'This sport uses a round orange ball and a hoop', answer: 'What is basketball?' },
								{ value: 200, question: 'This country hosted the 2020 Summer Olympics', answer: 'What is Japan?' },
								{ value: 300, question: 'This tennis tournament is played on grass', answer: 'What is Wimbledon?' },
								{ value: 400, question: 'This soccer player is nicknamed "CR7"', answer: 'Who is Cristiano Ronaldo?' },
								{ value: 500, question: 'This American football event is the championship game of the NFL', answer: 'What is the Super Bowl?' }
							]
						}
					];

					const gameConfig = {
						title: env.GAME_TITLE || 'Jeopardy!',
						countdown: 30,
						categories: defaultCategories
					};

					function getClientGameState() {
						return {
							players: Array.from(players.values()),
							currentQuestion,
							currentCategory,
							answeredQuestions: Array.from(answeredQuestions),
							buzzerOrder,
							buzzerLocked,
							gamePhase,
							showAnswer
						};
					}

					function broadcastGameState() {
						io.emit('gameState', getClientGameState());
					}

					io.on('connection', (socket) => {
						console.log('Client connected:', socket.id);

						socket.emit('gameConfig', {
							title: gameConfig.title,
							countdown: gameConfig.countdown,
							categories: gameConfig.categories.map(cat => ({
								name: cat.name,
								questions: cat.questions.map(q => ({ value: q.value }))
							}))
						});
						socket.emit('gameState', getClientGameState());

						socket.on('hostJoin', () => {
							socket.join('host');
							console.log('Host connected');
							broadcastGameState();
						});

						socket.on('playerJoin', (username: string) => {
							// Check if player with same name exists (session restoration)
							const existingPlayer = playersByName.get(username.toLowerCase());
							if (existingPlayer) {
								// Update the player's socket id
								players.delete(existingPlayer.id);
								existingPlayer.id = socket.id;
								players.set(socket.id, existingPlayer);
								playersByName.set(username.toLowerCase(), existingPlayer);
								console.log(`Player restored session: ${username}`);
							} else {
								const player = { id: socket.id, name: username, score: 0 };
								players.set(socket.id, player);
								playersByName.set(username.toLowerCase(), player);
								console.log(`Player joined: ${username}`);
							}
							socket.join('players');
							broadcastGameState();
						});

						socket.on('startGame', () => {
							gamePhase = 'playing';
							answeredQuestions.clear();
							players.forEach(player => { player.score = 0; });
							broadcastGameState();
						});

						socket.on('selectQuestion', (data: { category: string; value: number }) => {
							const category = gameConfig.categories.find(c => c.name === data.category);
							if (category) {
								const question = category.questions.find(q => q.value === data.value);
								if (question) {
									currentQuestion = question;
									currentCategory = data.category;
									buzzerOrder = [];
									buzzerLocked = false;
									gamePhase = 'question';
									showAnswer = false;
									broadcastGameState();

									io.to('host').emit('fullQuestion', {
										category: data.category,
										question: question.question,
										answer: question.answer,
										value: question.value,
										image: question.image,
										youtube: question.youtube
									});
								}
							}
						});

						socket.on('buzz', () => {
							if (buzzerLocked) return;
							const player = players.get(socket.id);
							if (!player) return;
							if (buzzerOrder.some(b => b.playerId === socket.id)) return;

							buzzerOrder.push({
								playerId: socket.id,
								playerName: player.name,
								timestamp: Date.now()
							});
							
							// Notify host of new buzz with sound
							io.to('host').emit('buzzerSound', { playerName: player.name });
							
							broadcastGameState();
						});

						socket.on('lockBuzzer', () => {
							buzzerLocked = true;
							broadcastGameState();
						});

						socket.on('unlockBuzzer', () => {
							buzzerLocked = false;
							broadcastGameState();
						});

						socket.on('clearBuzzers', () => {
							buzzerOrder = [];
							broadcastGameState();
						});

						socket.on('revealAnswer', () => {
							showAnswer = true;
							broadcastGameState();
						});

						socket.on('correctAnswer', (playerId: string) => {
							const player = players.get(playerId);
							if (player && currentQuestion) {
								player.score += currentQuestion.value;
								if (currentCategory && currentQuestion) {
									answeredQuestions.add(`${currentCategory}-${currentQuestion.value}`);
								}
								currentQuestion = null;
								currentCategory = null;
								buzzerOrder = [];
								buzzerLocked = true;
								gamePhase = 'playing';
								showAnswer = false;
								broadcastGameState();
							}
						});

						socket.on('incorrectAnswer', (playerId: string) => {
							const player = players.get(playerId);
							if (player && currentQuestion) {
								player.score -= currentQuestion.value;
								buzzerOrder = buzzerOrder.filter(b => b.playerId !== playerId);
								buzzerLocked = false;
								broadcastGameState();
							}
						});

						socket.on('skipQuestion', () => {
							if (currentCategory && currentQuestion) {
								answeredQuestions.add(`${currentCategory}-${currentQuestion.value}`);
							}
							currentQuestion = null;
							currentCategory = null;
							buzzerOrder = [];
							buzzerLocked = true;
							gamePhase = 'playing';
							showAnswer = false;
							broadcastGameState();
						});

						socket.on('showLeaderboard', () => {
							gamePhase = 'leaderboard';
							currentQuestion = null;
							currentCategory = null;
							showAnswer = false;
							broadcastGameState();
						});

						socket.on('backToGame', () => {
							gamePhase = 'playing';
							broadcastGameState();
						});

						socket.on('resetGame', () => {
							players.forEach(player => { player.score = 0; });
							answeredQuestions.clear();
							currentQuestion = null;
							currentCategory = null;
							buzzerOrder = [];
							buzzerLocked = true;
							gamePhase = 'lobby';
							showAnswer = false;
							broadcastGameState();
						});

						socket.on('disconnect', () => {
							const player = players.get(socket.id);
							if (player) {
								console.log(`Player disconnected: ${player.name}`);
								// Don't delete from playersByName to allow session restoration
								players.delete(socket.id);
								buzzerOrder = buzzerOrder.filter(b => b.playerId !== socket.id);
								broadcastGameState();
							}
						});
					});
				}
			}
		]
	};
});
