<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import './layout.css';
	import { initSocket, gameConfig } from '$lib/stores/socket';
	
	let { children } = $props();

	onMount(() => {
		if (browser) {
			initSocket();
		}
	});
</script>

<svelte:head>
	<title>{$gameConfig.title}</title>
	<meta name="description" content="Self-hosted trivia game" />
</svelte:head>

{@render children()}
