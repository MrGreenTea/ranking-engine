<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card } from '$lib/components/ui/card';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import { Textarea } from '$lib/components/ui/textarea';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import { localStore } from '$lib/utils/storage.svelte';
	import { onMount } from 'svelte';
	import Transition from '$lib/components/transitions.svelte';
	import ComparisonButton from '$lib/components/comparison-button.svelte';
	import { estimateMergeSortComparisons, mergeSort } from '$lib/sorting';
	import { estimateTopKComparisons, findTopK } from '$lib/top-k-selection';
	import { binaryInsert } from '$lib/binary-insert';

	type Phase = 'create' | 'compare' | 'result';

	let items = localStore<string[]>('ranking-items', []);
	let sortedItems = localStore<string[]>('ranking-sorted-items', []);
	let remainingItems = localStore<string[]>('ranking-remaining-items', []);
	let comparisonsCount = localStore<number>('ranking-comparisons-count', 0);
	let estimatedComparisons = localStore<number>('ranking-estimated-comparisons', 0);
	let currentComparison = $state<{ item1: string; item2: string } | null>(null);
	let newItem = $state('');
	let insertItem = $state('');
	let importText = $state('');
	let dialogOpen = $state(false);
	let resolveCurrentComparison: ((value: string) => void) | null = null;
	let highlightedItem = $state<string | null>(null);
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

	function removeItem(item: string) {
		items.value = items.value.filter((i) => i !== item);
		if (sortedItems.value.includes(item)) {
			sortedItems.value = sortedItems.value.filter((i) => i !== item);
		}
		if (remainingItems.value.includes(item)) {
			remainingItems.value = remainingItems.value.filter((i) => i !== item);
		}
	}

	function removeSortedItem(item: string) {
		sortedItems.value = sortedItems.value.filter((i) => i !== item);
	}

	async function copyList() {
		try {
			await navigator.clipboard.writeText(sortedItems.value.join('\n'));
		} catch (err) {
			console.error('Failed to copy list:', err);
		}
	}

	function addItem() {
		const trimmedItem = newItem.trim();
		if (trimmedItem && !items.value.includes(trimmedItem)) {
			items.value = [...items.value, trimmedItem];
			newItem = '';
		}
	}

	function importItems() {
		const newItems = importText
			.split('\n')
			.map((item) => item.trim())
			.filter((item) => item.length > 0 && !items.value.includes(item));

		items.value = [...items.value, ...newItems];
		importText = '';
		dialogOpen = false;
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

	async function insertNewItem() {
		const trimmedItem = insertItem.trim();
		if (trimmedItem && !sortedItems.value.includes(trimmedItem)) {
			const currentPhase = phase;
			phase = 'compare';
			await binaryInsert(trimmedItem, sortedItems.value, compareItems);
			phase = currentPhase;
			insertItem = '';
			// Briefly highlight the newly inserted item
			highlightedItem = trimmedItem;
			setTimeout(() => {
				highlightedItem = null;
			}, 1000);
		}
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
		<div class="phase-container">
			<!-- Phase 1: Create List -->
			<Transition show={phase === 'create'} key="create">
				<Card class="p-6">
					<h2 class="mb-4 text-xl font-semibold">Items to Rank</h2>
					<div class="mb-4 flex gap-2">
						<Input
							type="text"
							placeholder="Add an item..."
							bind:value={newItem}
							onkeydown={(e) => e.key === 'Enter' && addItem()}
						/>
						<Button onclick={addItem}>Add</Button>
						<Dialog bind:open={dialogOpen}>
							<DialogTrigger>
								<div
									class="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
								>
									Import
								</div>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Import Items</DialogTitle>
								</DialogHeader>
								<div class="space-y-4">
									<Textarea
										placeholder="Enter items, one per line"
										bind:value={importText}
										rows={10}
										onkeydown={(e) => {
											if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
												e.preventDefault();
												importItems();
											}
										}}
									/>
									<Button onclick={importItems} class="w-full">Import Items</Button>
								</div>
							</DialogContent>
						</Dialog>
					</div>

					<div class="flex items-center gap-2">
						<Input type="number" min="1" placeholder="Top K items (optional)" bind:value={topK} />
						<Button disabled={items.value.length < 2} onclick={startSorting}>Start Sorting</Button>
					</div>

					{#if items.value.length > 0}
						<div class="text-sm text-muted-foreground">
							Estimated comparisons: {topK !== null && topK > 0
								? estimateTopKComparisons(items.value.length, topK)
								: estimateMergeSortComparisons(items.value.length)}
						</div>
						<ul class="space-y-2">
							{#each items.value as item (item)}
								<li animate:flip={{ duration: 300 }} transition:fade={{ duration: 200 }}>
									<Card class="flex items-center justify-between gap-3 p-3">
										<p class="flex-1 text-sm">{item}</p>
										<Button
											onclick={() => removeItem(item)}
											variant="ghost"
											class="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
												><path d="M3 6h18" /><path
													d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6a2 2 0 0 1 2-2h2"
												/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg
											>
											<span class="sr-only">Remove {item}</span>
										</Button>
									</Card>
								</li>
							{/each}
						</ul>
					{/if}
				</Card>
			</Transition>

			<!-- Phase 2: Compare Items -->
			<Transition show={phase === 'compare' && currentComparison !== null} key="compare">
				<Card class="p-6">
					<h2 class="mb-4 text-xl font-semibold">Compare items</h2>
					<p class="mb-4 text-sm text-muted-foreground">Click on the item you prefer:</p>
					<div class="grid gap-4 sm:grid-cols-2" data-testid="comparison-buttons">
						<ComparisonButton
							item={currentComparison?.item1 ?? ''}
							onSelect={() => {
								if (currentComparison) choose(currentComparison.item1);
							}}
							onHighlight={() => {
								if (currentComparison) highlightedItem = currentComparison.item1;
							}}
							onUnhighlight={() => (highlightedItem = null)}
						/>
						<ComparisonButton
							item={currentComparison?.item2 ?? ''}
							onSelect={() => {
								if (currentComparison) choose(currentComparison.item2);
							}}
							onHighlight={() => {
								if (currentComparison) highlightedItem = currentComparison.item2;
							}}
							onUnhighlight={() => (highlightedItem = null)}
						/>
					</div>
				</Card>
			</Transition>

			<!-- Phase 3: Show Results -->
			<Transition show={phase === 'result'} key="result">
				<Card class="p-6">
					<div class="mb-4 space-y-2">
						<div class="flex items-center justify-between">
							<h2 class="text-xl font-semibold">
								{#if topK !== null && topK > 0}
									Top {topK} Items
								{:else}
									Sorted List
								{/if}
							</h2>
							<Button onclick={copyList} variant="outline" class="gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path
										d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
									/></svg
								>
								Copy List
							</Button>
						</div>
						<div class="space-y-1 text-sm text-muted-foreground">
							<p>Actual comparisons: {comparisonsCount.value} / {estimatedComparisons.value}</p>
						</div>
					</div>

					<div class="space-y-4">
						<ul class="space-y-2">
							{#each sortedItems.value as item (item)}
								<li
									animate:flip={{ duration: 300 }}
									transition:fade={{ duration: 200 }}
									class:highlight={item === highlightedItem}
								>
									<Card
										class="flex items-center justify-between gap-3 p-3"
										data-testid="sorted-item"
									>
										<p class="flex-1 text-sm">{item}</p>
										<Button onclick={() => removeSortedItem(item)} variant="ghost" size="icon">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="24"
												height="24"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
											>
										</Button>
									</Card>
								</li>
							{/each}
						</ul>

						{#if remainingItems.value.length > 0}
							<div class="my-4 flex items-center gap-4">
								<div class="h-px flex-1 bg-border"></div>
								<p class="text-sm text-muted-foreground">Remaining Items</p>
								<div class="h-px flex-1 bg-border"></div>
							</div>

							<ul class="space-y-2">
								{#each remainingItems.value as item (item)}
									<li animate:flip={{ duration: 300 }} transition:fade={{ duration: 200 }}>
										<Card class="flex items-center justify-between gap-3 bg-muted p-3">
											<p class="flex-1 text-sm">{item}</p>
										</Card>
									</li>
								{/each}
							</ul>
						{/if}

						{#if phase === 'result'}
							<div class="flex gap-2">
								<Input
									bind:value={insertItem}
									placeholder="Insert new item..."
									onkeydown={(e) => e.key === 'Enter' && insertNewItem()}
								/>
								<Button onclick={insertNewItem}>Insert</Button>
							</div>
						{/if}
					</div>
				</Card>
			</Transition>
		</div>
	</div>
</main>

<style>
	.phase-container {
		position: relative;
		min-height: 200px;
	}

	.phase-container > :global(*) {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
	}
</style>
