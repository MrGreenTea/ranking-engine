<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { localStore } from '$lib/utils/storage.svelte';
	import { onMount } from 'svelte';
	import CreatePhase from './components/CreatePhase.svelte';
	import ComparePhase from './components/ComparePhase.svelte';
	import ResultPhase from './components/ResultPhase.svelte';

	import { crossfade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { estimateMergeSortComparisons } from '$lib/sorting';
	import { estimateTopKComparisons } from '$lib/top-k-selection';

	type Phase = 'create' | 'compare' | 'result';

	let items = localStore<string[]>('ranking-items', []);
	let sortedItems = localStore<string[]>('ranking-sorted-items', []);
	let remainingItems = localStore<string[]>('ranking-remaining-items', []);
	let comparisonsCount = localStore<number>('ranking-comparisons-count', 0);
	let estimatedComparisons = localStore<number>('ranking-estimated-comparisons', 0);
	let comparisonCache = localStore<Record<string, string[]>>('ranking-comparison-cache', {});

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

	let topK = localStore<number | null>('ranking-top-k', null);

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
		estimatedComparisons.reset();
		comparisonCache.reset();
	}

	$effect(() => {
		if (topK.value !== null) {
			estimatedComparisons.value = estimateTopKComparisons(items.value.length, topK.value);
		} else {
			estimatedComparisons.value = estimateMergeSortComparisons(items.value.length);
		}
	});

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
				<div class="block w-full" in:receive={{ key: 'phase' }} out:send={{ key: 'phase' }}>
					<CreatePhase onStartSorting={startSorting} {items} {topK} />
				</div>
			{/if}

			{#if phase === 'compare'}
				<!-- Phase 2: Compare Items -->
				<div class="block w-full" in:receive={{ key: 'phase' }} out:send={{ key: 'phase' }}>
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
					/>
				</div>
			{/if}

			<!-- Phase 3: Show Results -->
			{#if phase === 'result'}
				<div class="block w-full" in:receive={{ key: 'phase' }} out:send={{ key: 'phase' }}>
					<ResultPhase
						topK={topK.value}
						comparisonsCount={comparisonsCount.value}
						estimatedComparisons={estimatedComparisons.value}
						sortedItems={sortedItems.value}
						remainingItems={remainingItems.value}
						bind:phase
						{items}
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
</style>
