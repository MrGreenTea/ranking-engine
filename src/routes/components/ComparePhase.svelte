<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';

	let {
		currentComparison,
		choose
	}: {
		currentComparison: { item1: string; item2: string };
		choose: (item: string) => void;
	} = $props();

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowLeft') {
			choose(currentComparison.item1);
		} else if (event.key === 'ArrowRight') {
			choose(currentComparison.item2);
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<Card class="p-6">
	<h2 class="mb-4 text-xl font-semibold">Compare items</h2>
	<p class="mb-4 text-sm text-muted-foreground">Click on the item you prefer:</p>
	<div class="grid gap-4 sm:grid-cols-2" data-testid="comparison-buttons">
		{#key currentComparison.item1}
			<Button onclick={() => choose(currentComparison.item1)} class="h-32 text-lg">
				{currentComparison.item1}
			</Button>{/key}
		{#key currentComparison.item2}
			<Button onclick={() => choose(currentComparison.item2)} class="h-32 text-lg">
				{currentComparison.item2}
			</Button>
		{/key}
	</div>
</Card>
