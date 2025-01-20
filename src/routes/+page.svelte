<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { localStore } from '$lib/utils/storage.svelte';
	import { onMount } from 'svelte';
	import Transition from '$lib/components/transitions.svelte';
	import { estimateMergeSortComparisons, mergeSort } from '$lib/sorting';
	import { estimateTopKComparisons, findTopK } from '$lib/top-k-selection';
	import CreatePhase from './components/CreatePhase.svelte';
	import ComparePhase from './components/ComparePhase.svelte';
	import ResultPhase from './components/ResultPhase.svelte';

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

	onMount(() => {
		// If we have sorted items, go to result phase
		if (sortedItems.value.length > 0) {
			phase = 'result';
		}
	});

	async function compareItems(a: string, b: string): Promise<number> {
		currentComparison = { item1: a, item2: b };
		const choice = await new Promise<string>((resolve) => {
			resolveCurrentComparison = resolve;
		});
		currentComparison = null;
		resolveCurrentComparison = null;
		comparisonsCount.value++;
		return choice === a ? -1 : 1;
	}

	function clearAll() {
		phase = 'create';
		items.reset();
		sortedItems.reset();
		remainingItems.reset();
		comparisonsCount.reset();
		estimatedComparisons.reset();
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
			<Transition show={phase === 'create'} key="create">
				<CreatePhase onStartSorting={startSorting} {items} bind:topK />
			</Transition>

			<!-- Phase 2: Compare Items -->
			<Transition show={phase === 'compare' && currentComparison !== null} key="compare">
				<ComparePhase {currentComparison} {choose} />
			</Transition>

			<!-- Phase 3: Show Results -->
			<Transition show={phase === 'result'} key="result">
				<ResultPhase
					{topK}
					comparisonsCount={comparisonsCount.value}
					estimatedComparisons={estimatedComparisons.value}
					sortedItems={sortedItems.value}
					remainingItems={remainingItems.value}
					{compareItems}
					bind:phase
				/>
			</Transition>
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
