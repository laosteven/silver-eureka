<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { initSocket, gameConfig } from '$lib/stores/socket';

	onMount(() => {
		if (browser) {
			initSocket();
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 p-4">
	<Card class="w-full max-w-md">
		<CardHeader class="text-center">
			<CardTitle class="text-4xl font-bold text-blue-600">{$gameConfig.title.toUpperCase()}</CardTitle>
			<CardDescription class="text-lg">Self-hosted trivia game</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<a href="/host" class="block">
				<Button class="w-full text-lg py-6" variant="default">
					Host a Game
				</Button>
			</a>
			<a href="/play" class="block">
				<Button class="w-full text-lg py-6" variant="secondary">
					Join as Player
				</Button>
			</a>
		</CardContent>
	</Card>
</div>
