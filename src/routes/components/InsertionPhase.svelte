<script lang="ts">
	import { binaryInsert } from '$lib/binary-insert';
	import { Card } from '$lib/components/ui/card';
	import { onMount, tick } from 'svelte';
	import { fade } from 'svelte/transition';

	let {
		newItem,
		onInsertionFinished,
		sortedItems
	}: {
		newItem: string;
		onInsertionFinished: (result: string[]) => void;
		sortedItems: string[];
	} = $props();

	let comparisonsCount = $state(0);
	let currentComparison = $state<null | { item1: string; item2: string }>(null);
	let totalComparisons = $state(0);
	let currentProgress = $derived(Math.round((comparisonsCount / totalComparisons) * 100) || 0);

	let resolveCurrentComparison: ((value: string) => void) | null = null;

	async function compareItems(a: string, b: string): Promise<number> {
		currentComparison = { item1: a, item2: b };
		const choice = await new Promise<string>((resolve) => {
			resolveCurrentComparison = resolve;
		});
		currentComparison = null;
		resolveCurrentComparison = null;

		if (choice === a) {
			return -1;
		} else {
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
		// +1 because for the new item (the array will be one longer after insertion)
		totalComparisons = Math.ceil(Math.log2(sortedItems.length + 1));
		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});

	async function insert() {
		// HACK: Svelte does not like us setting the state inside a promise
		// so we need to wait a tick and only then start sorting.
		// TODO: find a better way to do this!!
		await tick();
		await binaryInsert(newItem, sortedItems, compareItems);
		onInsertionFinished(sortedItems);
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
	{#await insert()}
		<h2 class="mb-4 text-xl font-semibold">Compare items</h2>
		<div class="flex items-center justify-between">
			<span class="text-sm text-muted-foreground"
				>{comparisonsCount} / {totalComparisons} comparisons</span
			>
		</div>
		<div class="my-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
			<div class="h-full bg-primary transition-all" style="width: {currentProgress}%"></div>
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
