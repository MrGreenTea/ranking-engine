<script lang="ts">
	import type { LocalStore } from '$lib/utils/storage.svelte';

	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { mergeSort } from '$lib/sorting';
	import { findTopK } from '$lib/top-k-selection';
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { fade } from 'svelte/transition';

	let {
		comparisonsCount,
		estimatedComparisons,
		items,
		onRestart,
		onSortingFinished,
		topK
	}: {
		comparisonsCount: LocalStore<number>;
		estimatedComparisons: { max: number; min: number };
		items: string[];
		onRestart: () => void;
		onSortingFinished: (top: string[], rest: string[], comparisonsCount: number) => void;
		topK: null | number;
	} = $props();

	let currentComparison = $state<null | { item1: string; item2: string }>(null);
	let resolveCurrentComparison: ((value: string) => void) | null = null;

	let currentProgress = Tween.of(
		() => Math.round((comparisonsCount.value / estimatedComparisons.max) * 100),
		{ duration: 100 }
	);

	async function compareItems(a: string, b: string): Promise<number> {
		currentComparison = { item1: a, item2: b };
		const choice = await new Promise<string>((resolve) => {
			resolveCurrentComparison = resolve;
		});
		resolveCurrentComparison = null;
		if (choice === a) {
			return -1;
		} else {
			return 1;
		}
	}

	function choose(winner: string) {
		comparisonsCount.value++;
		resolveCurrentComparison?.(winner);
	}

	function restart() {
		currentComparison = null;
		resolveCurrentComparison = null;
		comparisonsCount.value = 0;
		onRestart();
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
		let rest: string[], result: string[];
		if (topK !== null && topK > 0) {
			[result, rest] = await findTopK([...items], topK, compareItems);
		} else {
			result = await mergeSort([...items], compareItems);
			rest = [];
		}
		currentComparison = null;

		onSortingFinished(result, rest, comparisonsCount.value);
	}
</script>

{#snippet ComparisonButton(item: string)}
	<button
		onclick={() => {
			if (currentComparison != null) choose(item);
		}}
		class="grid h-full grid-cols-1 grid-rows-1 items-center gap-2 whitespace-nowrap text-wrap break-words rounded-md bg-primary px-4 py-2 text-lg font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
	>
		{#key item}
			<span transition:fade class="col-start-1 row-start-1">{item}</span>
		{/key}
	</button>
{/snippet}

<Card class="p-6">
	{#await sort()}
		<h2 class="mb-4 text-xl font-semibold">Compare items</h2>
		<div class="flex items-center justify-between">
			<span class="text-sm text-muted-foreground"
				>{comparisonsCount.value} / {estimatedComparisons.max} comparisons</span
			>
			<Button onclick={restart} variant="outline" size="sm">Restart</Button>
		</div>
		<div class="relative my-4">
			<div class="h-3 w-full overflow-hidden rounded-full bg-secondary">
				<div
					class="h-full bg-primary transition-all duration-300"
					style="width: {currentProgress.current}%"
				></div>
			</div>
			<div
				class="absolute -top-1 h-5 w-1 translate-x-[-50%] bg-primary ring-2 ring-white"
				style="left: {(estimatedComparisons.min / estimatedComparisons.max) * 100}%"
				title="Best case: {estimatedComparisons.min} comparisons"
			></div>
		</div>
		<hr class="my-4" />
		<p class="mb-4 text-sm text-muted-foreground">Click on the item you prefer:</p>
		<div
			class="grid min-h-32 grid-rows-2 gap-4 sm:grid-cols-2 sm:grid-rows-1"
			data-testid="comparison-buttons"
		>
			{#if currentComparison != null}
				{@render ComparisonButton(currentComparison.item1)}
				{@render ComparisonButton(currentComparison.item2)}
			{/if}
		</div>
	{:then}
		Finished sorting!
	{/await}
</Card>
