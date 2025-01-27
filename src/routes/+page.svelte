<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { estimateMergeSortComparisons } from '$lib/sorting';
	import { estimateTopKComparisons } from '$lib/top-k-selection';
	import { localStore } from '$lib/utils/storage.svelte';
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';

	import ComparePhase from './components/ComparePhase.svelte';
	import CreatePhase from './components/CreatePhase.svelte';
	import InsertionPhase from './components/InsertionPhase.svelte';
	import ResultPhase from './components/ResultPhase.svelte';

	type Phase = 'compare' | 'create' | 'insertion' | 'result';

	let items = localStore<string[]>('ranking-items', []);
	let sortedItems = localStore<string[]>('ranking-sorted-items', []);
	let remainingItems = localStore<string[]>('ranking-remaining-items', []);

	let topK = localStore<null | number>('ranking-top-k', null);
	let comparisonsCount = localStore<number>('ranking-comparisons-count', 0);
	let comparisonCache = localStore<Record<string, string[]>>('ranking-comparison-cache', {});
	let newItem = $state<null | string>(null);

	let phase = $state<Phase>('create');

	onMount(() => {
		// If we have sorted items, go to result phase
		if (sortedItems.value.length > 0) {
			phase = 'result';
		}
		// If we have items and comparison cache, go to compare phase
		else if (items.value.length > 0 && comparisonsCount.value > 0) {
			phase = 'compare';
		}
	});

	const estimatedComparisons = $derived.by(() => {
		if (topK.value !== null) {
			return estimateTopKComparisons(items.value.length, topK.value);
		} else {
			return estimateMergeSortComparisons(items.value.length);
		}
	});

	const [send, receive] = crossfade({
		duration: 200,
		easing: cubicOut
	});

	function clearAll() {
		phase = 'create';
		items.reset();
		sortedItems.reset();
		remainingItems.reset();
		comparisonsCount.reset();
		comparisonCache.reset();
		topK.reset();
	}
	async function startSorting() {
		if (items.value.length < 2) return;
		phase = 'compare';
		comparisonCache.reset();
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
				<div
					class="absolute block w-full"
					in:receive={{ key: 'phase' }}
					out:send={{ key: 'phase' }}
				>
					<CreatePhase onStartSorting={startSorting} {items} {topK} />
				</div>
			{:else if phase === 'compare'}
				<!-- Phase 2: Compare Items -->
				<div
					class="absolute inset-0 block w-full"
					in:receive={{ key: 'phase' }}
					out:send={{ key: 'phase' }}
				>
					<ComparePhase
						topK={topK.value}
						items={items.value}
						{comparisonCache}
						{comparisonsCount}
						onSortingFinished={(top, rest, comparisons) => {
							sortedItems.value = top;
							remainingItems.value = rest;
							comparisonsCount.value = comparisons;
							phase = 'result';
						}}
						{estimatedComparisons}
					/>
				</div>
			{:else if phase === 'insertion' && newItem !== null}
				<!-- Phase 3: Insertion Items -->
				<div
					class="absolute inset-0 block w-full"
					in:receive={{ key: 'phase' }}
					out:send={{ key: 'phase' }}
				>
					<InsertionPhase
						sortedItems={sortedItems.value}
						{newItem}
						{comparisonCache}
						onInsertionFinished={(result) => {
							sortedItems.value = result;
							newItem = null;
							phase = 'result';
						}}
					/>
				</div>
			{:else if phase === 'result'}
				<!-- Phase 4: Show Results -->
				<div
					class="absolute block w-full"
					in:receive={{ key: 'phase' }}
					out:send={{ key: 'phase' }}
				>
					<ResultPhase
						topK={topK.value}
						comparisonsCount={comparisonsCount.value}
						sortedItems={sortedItems.value}
						remainingItems={remainingItems.value}
						onInsertNewItem={(i) => {
							phase = 'insertion';
							newItem = i;
						}}
					/>
				</div>
			{/if}
		</div>
	</div>
</main>
