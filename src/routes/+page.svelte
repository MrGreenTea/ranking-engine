<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { localStore } from '$lib/utils/storage.svelte';
	import { onMount } from 'svelte';
	import { estimateMergeSortComparisons, mergeSort } from '$lib/sorting';
	import { estimateTopKComparisons, findTopK } from '$lib/top-k-selection';
	import CreatePhase from './components/CreatePhase.svelte';
	import ComparePhase from './components/ComparePhase.svelte';
	import ResultPhase from './components/ResultPhase.svelte';

	import { crossfade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	type Phase = 'create' | 'compare' | 'result';

	let items = localStore<string[]>('ranking-items', []);
	let sortedItems = localStore<string[]>('ranking-sorted-items', []);
	let remainingItems = localStore<string[]>('ranking-remaining-items', []);
	let comparisonsCount = localStore<number>('ranking-comparisons-count', 0);
	let estimatedComparisons = localStore<number>('ranking-estimated-comparisons', 0);
	let currentComparison = $state<{ item1: string; item2: string } | null>(null);
	let resolveCurrentComparison: ((value: string) => void) | null = null;
	let phase = $state<Phase>('create');
	let topK = $state<number | null>(null);

	let comparisonCache = new Map<string, string[]>();

	const [send, receive] = crossfade({
		duration: 200,
		easing: cubicOut
	});

	onMount(() => {
		// If we have sorted items, go to result phase
		if (sortedItems.value.length > 0) {
			phase = 'result';
		}
	});

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
		comparisonsCount.value++;
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

	function clearAll() {
		phase = 'create';
		items.reset();
		sortedItems.reset();
		remainingItems.reset();
		comparisonsCount.reset();
		estimatedComparisons.reset();
		comparisonCache.clear();
	}

	async function startSorting() {
		if (items.value.length < 2) return;
		phase = 'compare';
		comparisonsCount.value = 0;

		if (topK !== null && topK > 0) {
			estimatedComparisons.value = estimateTopKComparisons(items.value.length, topK);
			const [top, rest] = await findTopK([...items.value], topK, compareItems);
			sortedItems.value = top;
			remainingItems.value = rest;
		} else {
			estimatedComparisons.value = estimateMergeSortComparisons(items.value.length);
			sortedItems.value = await mergeSort([...items.value], compareItems);
			remainingItems.value = [];
		}

		phase = 'result';
	}

	function choose(winner: string) {
		resolveCurrentComparison?.(winner);
	}
</script>

<main class="container mx-auto max-w-2xl p-4">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Ranking Engine</h1>
			<div class="mt-2">
				<a href="/collaborative" class="text-blue-500 hover:underline">Try Collaborative Ranking</a>
			</div>
		</div>
		<Button onclick={clearAll} variant="destructive">Clear All</Button>
	</div>

	<div class="space-y-8">
		<div class="phase-container relative min-h-[200px]">
			<!-- Phase 1: Create List -->
			{#if phase === 'create'}
				<div class="transition-content" in:receive={{ key: 'phase' }} out:send={{ key: 'phase' }}>
					<CreatePhase onStartSorting={startSorting} {items} bind:topK />
				</div>
			{/if}

			{#if phase === 'compare'}
				<!-- Phase 2: Compare Items -->
				<div class="transition-content" in:receive={{ key: 'phase' }} out:send={{ key: 'phase' }}>
					{#if currentComparison}
						<ComparePhase {currentComparison} {choose} />
					{/if}
				</div>
			{/if}

			<!-- Phase 3: Show Results -->
			{#if phase === 'result'}
				<div class="transition-content" in:receive={{ key: 'phase' }} out:send={{ key: 'phase' }}>
					<ResultPhase
						{topK}
						comparisonsCount={comparisonsCount.value}
						estimatedComparisons={estimatedComparisons.value}
						sortedItems={sortedItems.value}
						remainingItems={remainingItems.value}
						{compareItems}
						bind:phase
					/>
				</div>
			{/if}
		</div>
	</div>
</main>

<style>
	.phase-container > :global(*) {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
	}

	.transition-content {
		display: block;
		width: 100%;
	}
</style>
