<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card } from '$lib/components/ui/card';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import { loadFromStorage, saveToStorage, clearStorage } from '$lib/utils/storage';
	import { onMount } from 'svelte';
	import Transition from '$lib/components/transitions.svelte';
	import ComparisonButton from '$lib/components/comparison-button.svelte';

	type Phase = 'create' | 'compare' | 'result';

	let items = $state<string[]>([]);
	let currentComparison = $state<{ item1: string; item2: string } | null>(null);
	let newItem = $state('');
	let sortedItems = $state<string[]>([]);
	let remainingItems = $state<string[]>([]);
	let insertItem = $state('');
	let resolveCurrentComparison: ((value: string) => void) | null = null;
	let highlightedItem = $state<string | null>(null);
	let phase = $state<Phase>('create');
	let topK = $state<number | null>(null);

	onMount(() => {
		items = loadFromStorage('ranking-items', []);
		sortedItems = loadFromStorage('ranking-sorted-items', []);
		// If we have sorted items, go to result phase
		if (sortedItems.length > 0) {
			phase = 'result';
		}
	});

	$effect(() => {
		saveToStorage('ranking-items', items);
		saveToStorage('ranking-sorted-items', sortedItems);
	});

	function clearAll() {
		items = [];
		sortedItems = [];
		remainingItems = [];
		phase = 'create';
		clearStorage(['ranking-items', 'ranking-sorted-items']);
	}

	function removeItem(item: string) {
		items = items.filter((i) => i !== item);
		if (sortedItems.includes(item)) {
			sortedItems = sortedItems.filter((i) => i !== item);
		}
		if (remainingItems.includes(item)) {
			remainingItems = remainingItems.filter((i) => i !== item);
		}
	}

	function removeSortedItem(item: string) {
		sortedItems = sortedItems.filter((i) => i !== item);
	}

	async function copyList() {
		try {
			await navigator.clipboard.writeText(sortedItems.join('\n'));
		} catch (err) {
			console.error('Failed to copy list:', err);
		}
	}

	function addItem() {
		if (newItem.trim()) {
			items = [...items, newItem.trim()];
			newItem = '';
		}
	}

	async function compareItems(newItem: string, existingItem: string): Promise<boolean> {
		currentComparison = { item1: existingItem, item2: newItem };
		const choice = await new Promise<string>((resolve) => {
			resolveCurrentComparison = resolve;
		});
		currentComparison = null;
		resolveCurrentComparison = null;
		return choice === newItem;
	}

	async function findTopK(arr: string[], k: number): Promise<[string[], string[]]> {
		if (arr.length <= k) {
			return [await mergeSort(arr), []];
		}

		// Initialize heap with first item
		const heap = [arr[0]];
		const remaining = new Set(arr);
		remaining.delete(arr[0]);

		// Build heap of size k by comparing each new item with all existing items
		for (let i = 1; i < k; i++) {
			let pos = 0;
			const item = arr[i];
			remaining.delete(item);

			// Find position for new item by comparing with existing items
			while (pos < heap.length) {
				if (await compareItems(item, heap[pos])) {
					break;
				}
				pos++;
			}

			heap.splice(pos, 0, item);
		}

		// Process remaining items
		for (let i = k; i < arr.length; i++) {
			// Compare with the smallest item in heap (which is at the end)
			if (await compareItems(arr[i], heap[heap.length - 1])) {
				// Add replaced item back to remaining
				remaining.add(heap[heap.length - 1]);
				// Remove smallest item (from end)
				heap.pop();

				// Find position for new item
				let pos = 0;
				const item = arr[i];
				remaining.delete(item);

				while (pos < heap.length) {
					if (await compareItems(item, heap[pos])) {
						break;
					}
					pos++;
				}

				heap.splice(pos, 0, item);
			}
		}

		return [heap, Array.from(remaining)];
	}

	async function binaryInsert(item: string, list: string[] = sortedItems): Promise<number> {
		if (!list.length) {
			list.push(item);
			if (list === sortedItems) {
				sortedItems = list;
			}
			return 0;
		}

		let left = 0;
		let right = list.length - 1;
		const currentList = [...list];

		while (left <= right) {
			const mid = Math.floor((left + right) / 2);

			// If the new item should come before the middle item
			if (await compareItems(item, currentList[mid])) {
				right = mid - 1;
			} else {
				left = mid + 1;
			}
		}

		// Insert at the found position
		currentList.splice(left, 0, item);
		if (list === sortedItems) {
			sortedItems = currentList;
		} else {
			list.splice(0, list.length, ...currentList);
		}
		return left;
	}

	async function mergeArrays(left: string[], right: string[]): Promise<string[]> {
		const result: string[] = [];
		let leftIndex = 0;
		let rightIndex = 0;

		while (leftIndex < left.length && rightIndex < right.length) {
			const item1 = left[leftIndex];
			const item2 = right[rightIndex];

			if (await compareItems(item2, item1)) {
				result.push(item2);
				rightIndex++;
			} else {
				result.push(item1);
				leftIndex++;
			}
		}

		return [...result, ...left.slice(leftIndex), ...right.slice(rightIndex)];
	}

	async function mergeSort(arr: string[]): Promise<string[]> {
		if (arr.length <= 1) return arr;

		const mid = Math.floor(arr.length / 2);
		const left = arr.slice(0, mid);
		const right = arr.slice(mid);

		const sortedLeft = await mergeSort(left);
		const sortedRight = await mergeSort(right);

		return mergeArrays(sortedLeft, sortedRight);
	}

	async function startSorting() {
		if (items.length < 2) return;
		phase = 'compare';

		if (topK !== null && topK > 0) {
			const [top, rest] = await findTopK([...items], topK);
			sortedItems = top;
			remainingItems = rest;
		} else {
			sortedItems = await mergeSort([...items]);
			remainingItems = [];
		}

		phase = 'result';
	}

	function choose(winner: string) {
		resolveCurrentComparison?.(winner);
	}

	async function insertNewItem() {
		if (insertItem.trim() && sortedItems.length > 0) {
			const item = insertItem.trim();
			insertItem = '';
			await binaryInsert(item);
			highlightedItem = item;
			setTimeout(() => {
				highlightedItem = null;
			}, 2000);
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
					<div class="space-y-4">
						<form
							class="flex gap-2"
							onsubmit={(e) => {
								e.preventDefault();
								addItem();
							}}
						>
							<Input bind:value={newItem} placeholder="Add an item..." />
							<Button type="submit">Add</Button>
						</form>

						<div class="flex items-center gap-2">
							<Input type="number" min="1" placeholder="Top K items (optional)" bind:value={topK} />
							<Button onclick={() => startSorting()}>Start Sorting</Button>
						</div>

						{#if items.length > 0}
							<ul class="space-y-2">
								{#each items as item (item)}
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
														d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
													/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg
												>
												<span class="sr-only">Remove {item}</span>
											</Button>
										</Card>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</Card>
			</Transition>

			<!-- Phase 2: Compare Items -->
			<Transition show={phase === 'compare' && currentComparison !== null} key="compare">
				<Card class="p-6">
					<h2 class="mb-4 text-xl font-semibold">Compare Items</h2>
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
					<div class="mb-4 flex items-center justify-between">
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

					<div class="space-y-4">
						<ul class="space-y-2">
							{#each sortedItems as item, i (item)}
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

						{#if remainingItems.length > 0}
							<div class="my-4 flex items-center gap-4">
								<div class="h-px flex-1 bg-border"></div>
								<p class="text-sm text-muted-foreground">Remaining Items</p>
								<div class="h-px flex-1 bg-border"></div>
							</div>

							<ul class="space-y-2">
								{#each remainingItems as item (item)}
									<li animate:flip={{ duration: 300 }} transition:fade={{ duration: 200 }}>
										<Card class="flex items-center justify-between gap-3 bg-muted p-3">
											<p class="flex-1 text-sm">{item}</p>
										</Card>
									</li>
								{/each}
							</ul>
						{/if}

						{#if phase === 'result'}
							<form
								class="flex gap-2"
								onsubmit={(e) => {
									e.preventDefault();
									insertNewItem();
								}}
							>
								<Input bind:value={insertItem} placeholder="Insert new item..." />
								<Button type="submit">Insert</Button>
							</form>
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
