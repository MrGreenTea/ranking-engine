<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';

	import { mergeSort } from '$lib/sorting';
	import { findTopK } from '$lib/top-k-selection';

	let currentComparison = $state<{ item1: string; item2: string } | null>(null);
	let comparisonsCount = $state(0);

	let {
		topK,
		items,
		onSortingFinished
	}: {
		topK: number | null;
		items: string[];
		onSortingFinished: (top: string[], rest: string[], comparisonsCount: number) => void;
	} = $props();

	let comparisonCache = new Map<string, string[]>();

	let resolveCurrentComparison: ((value: string) => void) | null = null;

	// Transitive closure of comparison
	// if a < c and c < b, then a < b
	// same with b < c and c < a then b < a
	function transitiveComparison(a: string, b: string): number | undefined {
		// Direct check in cache
		let cacheA = comparisonCache.get(a);
		if (cacheA?.includes(b)) return -1;

		let cacheB = comparisonCache.get(b);
		if (cacheB?.includes(a)) return 1;

		return undefined;
	}

	async function compareItems(a: string, b: string): Promise<number> {
		const cached = transitiveComparison(a, b);
		if (cached !== undefined) {
			console.log('Using cached comparison', cached, 'for pair', a, 'and', b);
			console.debug(comparisonCache);
			return cached;
		}

		currentComparison = { item1: a, item2: b };
		const choice = await new Promise<string>((resolve) => {
			resolveCurrentComparison = resolve;
		});
		currentComparison = null;
		resolveCurrentComparison = null;
		if (choice === a) {
			const cacheA = comparisonCache.get(a) ?? [];
			comparisonCache.set(a, [...cacheA, b]);
			return -1;
		} else {
			const cacheB = comparisonCache.get(b) ?? [];
			comparisonCache.set(b, [...cacheB, a]);
			return 1;
		}
	}

	function choose(winner: string) {
		comparisonsCount++;
		resolveCurrentComparison?.(winner);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (currentComparison === null) return;
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

	async function sort() {
		if (topK !== null && topK > 0) {
			const [top, rest] = await findTopK([...items], topK, compareItems);
			onSortingFinished(top, rest, comparisonsCount);
		} else {
			const result = await mergeSort([...items], compareItems);
			onSortingFinished(result, [], comparisonsCount);
		}
	}
</script>

<Card class="p-6">
	{#await sort()}
		<h2 class="mb-4 text-xl font-semibold">Compare items</h2>
		<p class="mb-4 text-sm text-muted-foreground">Click on the item you prefer:</p>
		<div
			class="grid min-h-32 grid-rows-2 gap-4 sm:grid-cols-2 sm:grid-rows-1"
			data-testid="comparison-buttons"
		>
			{#if currentComparison != null}
				{#key currentComparison.item1}
					<Button
						onclick={() => {
							if (currentComparison != null) choose(currentComparison.item1);
						}}
						class="h-full text-wrap break-words text-lg"
					>
						{currentComparison.item1}
					</Button>
				{/key}
				{#key currentComparison.item2}
					<Button
						onclick={() => {
							if (currentComparison != null) choose(currentComparison.item2);
						}}
						class="h-full text-wrap break-words text-lg"
					>
						{currentComparison.item2}
					</Button>
				{/key}
			{/if}
		</div>
	{:then}
		Finished sorting!
	{/await}
</Card>
