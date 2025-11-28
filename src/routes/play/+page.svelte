<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import {
		initSocket,
		playerJoin,
		gameState,
		gameConfig,
		playerId,
		buzz,
		connected
	} from '$lib/stores/socket';

	let username = $state('');
	let hasJoined = $state(false);
	let buzzed = $state(false);

	const STORAGE_KEY = 'jeopardy_username';

	onMount(() => {
		if (browser) {
			initSocket();
			
			// Check for saved username for session restoration
			const savedUsername = localStorage.getItem(STORAGE_KEY);
			if (savedUsername) {
				username = savedUsername;
			}
		}
	});

	function handleJoin() {
		if (username.trim()) {
			// Save username to localStorage for session restoration
			localStorage.setItem(STORAGE_KEY, username.trim());
			playerJoin(username.trim());
			hasJoined = true;
		}
	}

	function handleBuzz() {
		buzz();
		buzzed = true;
	}

	function getCurrentPlayer() {
		return $gameState.players.find(p => p.id === $playerId);
	}

	function getPlayerRank() {
		const sorted = [...$gameState.players].sort((a, b) => b.score - a.score);
		const index = sorted.findIndex(p => p.id === $playerId);
		return index + 1;
	}

	function hasBuzzed() {
		return $gameState.buzzerOrder.some(b => b.playerId === $playerId);
	}

	function getBuzzPosition() {
		const index = $gameState.buzzerOrder.findIndex(b => b.playerId === $playerId);
		return index + 1;
	}

	// Reset buzzed state when question changes or phase changes
	$effect(() => {
		if ($gameState.gamePhase !== 'question') {
			buzzed = false;
		}
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-purple-900 to-purple-700 p-4 flex items-center justify-center">
	{#if !$connected}
		<Card class="w-full max-w-md">
			<CardContent class="p-8 text-center">
				<p class="text-xl">Connecting to server...</p>
			</CardContent>
		</Card>
	{:else if !hasJoined}
		<!-- Username Entry -->
		<Card class="w-full max-w-md">
			<CardHeader class="text-center">
				<CardTitle class="text-3xl font-bold text-purple-600">{$gameConfig.title}</CardTitle>
				<CardDescription>Enter your name to join the game</CardDescription>
			</CardHeader>
			<CardContent>
				<form onsubmit={(e) => { e.preventDefault(); handleJoin(); }} class="space-y-4">
					<Input
						type="text"
						placeholder="Your name"
						bind:value={username}
						maxlength={20}
						class="text-lg py-6"
					/>
					<Button type="submit" class="w-full text-lg py-6" disabled={!username.trim()}>
						Join Game
					</Button>
				</form>
			</CardContent>
		</Card>
	{:else if $gameState.gamePhase === 'lobby'}
		<!-- Waiting in Lobby -->
		<Card class="w-full max-w-md">
			<CardHeader class="text-center">
				<CardTitle class="text-2xl">{$gameConfig.title}</CardTitle>
				<CardDescription>Waiting for host to start the game...</CardDescription>
			</CardHeader>
			<CardContent class="text-center">
				<div class="text-6xl mb-4">⏳</div>
				<p class="text-xl font-semibold mb-2">Welcome, {getCurrentPlayer()?.name}!</p>
				<p class="text-muted-foreground">{$gameState.players.length} player(s) joined</p>
			</CardContent>
		</Card>
	{:else if $gameState.gamePhase === 'playing'}
		<!-- Waiting for Question -->
		<Card class="w-full max-w-md">
			<CardHeader class="text-center">
				<CardTitle class="text-2xl">{getCurrentPlayer()?.name}</CardTitle>
			</CardHeader>
			<CardContent class="text-center space-y-4">
				<div class="text-6xl">🎯</div>
				<div class="bg-secondary p-4 rounded-lg">
					<p class="text-sm text-muted-foreground">Your Score</p>
					<p class="text-4xl font-bold text-purple-600">${getCurrentPlayer()?.score ?? 0}</p>
				</div>
				<div class="bg-secondary p-4 rounded-lg">
					<p class="text-sm text-muted-foreground">Your Rank</p>
					<p class="text-2xl font-bold">#{getPlayerRank()} of {$gameState.players.length}</p>
				</div>
				<p class="text-muted-foreground">Waiting for host to select a question...</p>
			</CardContent>
		</Card>
	{:else if $gameState.gamePhase === 'question'}
		<!-- Buzzer Screen -->
		<div class="w-full max-w-md">
			<Card class="mb-4">
				<CardHeader class="text-center pb-2">
					<CardTitle class="text-xl">{getCurrentPlayer()?.name}</CardTitle>
					<CardDescription class="text-2xl font-bold text-purple-600">${getCurrentPlayer()?.score ?? 0}</CardDescription>
				</CardHeader>
			</Card>

			{#if $gameState.buzzerLocked}
				<Card class="bg-red-100 border-red-300">
					<CardContent class="p-8 text-center">
						<div class="text-6xl mb-4">🔒</div>
						<p class="text-xl font-semibold text-red-800">Buzzer Locked</p>
						<p class="text-muted-foreground">Wait for the host to unlock...</p>
					</CardContent>
				</Card>
			{:else if hasBuzzed()}
				<Card class="bg-yellow-100 border-yellow-300">
					<CardContent class="p-8 text-center">
						<div class="text-6xl mb-4">✋</div>
						<p class="text-xl font-semibold text-yellow-800">You buzzed!</p>
						<p class="text-2xl font-bold">Position: #{getBuzzPosition()}</p>
					</CardContent>
				</Card>
			{:else}
				<button
					onclick={handleBuzz}
					class="w-full aspect-square bg-red-600 hover:bg-red-500 active:bg-red-700 active:scale-95 rounded-full shadow-2xl transition-all flex items-center justify-center"
				>
					<span class="text-white text-4xl font-bold">BUZZ!</span>
				</button>
			{/if}
		</div>
	{:else if $gameState.gamePhase === 'leaderboard'}
		<!-- Leaderboard -->
		<Card class="w-full max-w-md">
			<CardHeader class="text-center">
				<CardTitle class="text-3xl">🏆 Game Over! 🏆</CardTitle>
			</CardHeader>
			<CardContent class="text-center space-y-4">
				{@const rank = getPlayerRank()}
				<div class="text-6xl">
					{#if rank === 1}🥇{:else if rank === 2}🥈{:else if rank === 3}🥉{:else}🎮{/if}
				</div>
				<p class="text-2xl font-semibold">{getCurrentPlayer()?.name}</p>
				<div class="bg-secondary p-4 rounded-lg">
					<p class="text-sm text-muted-foreground">Final Score</p>
					<p class="text-4xl font-bold text-purple-600">${getCurrentPlayer()?.score ?? 0}</p>
				</div>
				<div class="bg-secondary p-4 rounded-lg">
					<p class="text-sm text-muted-foreground">Final Rank</p>
					<p class="text-2xl font-bold">#{rank} of {$gameState.players.length}</p>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
