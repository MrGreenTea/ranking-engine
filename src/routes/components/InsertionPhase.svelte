<script lang="ts">
	import type { LocalStore } from '$lib/utils/storage.svelte';

	import { binaryInsert } from '$lib/binary-insert';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { onMount, tick } from 'svelte';

	let {
		comparisonCache,
		newItem,
		onInsertionFinished,
		sortedItems
	}: {
		comparisonCache: LocalStore<Record<string, string[]>>;
		newItem: string;
		onInsertionFinished: (result: string[]) => void;
		sortedItems: string[];
	} = $props();

	let comparisonsCount = $state(0);
	let currentComparison = $state<null | { item1: string; item2: string }>(null);
	let totalComparisons = $state(0);
	let currentProgress = $derived(Math.round((comparisonsCount / totalComparisons) * 100) || 0);

	let resolveCurrentComparison: ((value: string) => void) | null = null;

	// Transitive closure of comparison
	// if a < c and c < b, then a < b
	// same with b < c and c < a then b < a
	function transitiveComparison(a: string, b: string): number | undefined {
		// Direct check in cache
		let cacheA = comparisonCache.value[a];
		if (cacheA?.includes(b)) return -1;

		let cacheB = comparisonCache.value[b];
		if (cacheB?.includes(a)) return 1;

		return undefined;
	}

	async function compareItems(a: string, b: string): Promise<number> {
		const cached = transitiveComparison(a, b);
		if (cached !== undefined) {
			console.log('Using cached comparison', cached, 'for pair', a, 'and', b);
			console.debug(comparisonCache.value);
			return cached;
		}

		currentComparison = { item1: a, item2: b };
		const choice = await new Promise<string>((resolve) => {
			resolveCurrentComparison = resolve;
		});
		currentComparison = null;
		resolveCurrentComparison = null;
		if (choice === a) {
			const cacheA = comparisonCache.value[a] ?? [];
			comparisonCache.value = {
				...comparisonCache.value,
				[a]: [...cacheA, b]
			};
			return -1;
		} else {
			const cacheB = comparisonCache.value[b] ?? [];
			comparisonCache.value = {
				...comparisonCache.value,
				[b]: [...cacheB, a]
			};
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
