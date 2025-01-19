<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card } from '$lib/components/ui/card';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import { loadFromStorage, saveToStorage, clearStorage } from '$lib/utils/storage';
	import { onMount } from 'svelte';

	let items = $state<string[]>([]);
	let currentComparison = $state<{ item1: string; item2: string } | null>(null);
	let newItem = $state('');
	let sortedItems = $state<string[]>([]);
	let insertItem = $state('');
	let resolveCurrentComparison: ((value: string) => void) | null = null;
	let highlightedItem = $state<string | null>(null);

	onMount(() => {
		items = loadFromStorage('ranking-items', []);
		sortedItems = loadFromStorage('ranking-sorted-items', []);
	});

	$effect(() => {
		saveToStorage('ranking-items', items);
		saveToStorage('ranking-sorted-items', sortedItems);
	});

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

		return await mergeArrays(sortedLeft, sortedRight);
	}

	async function binaryInsert(item: string) {
		if (!sortedItems.length) {
			sortedItems = [item];
			return 0;
		}

		let left = 0;
		let right = sortedItems.length - 1;
		const currentList = [...sortedItems];

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
		sortedItems = currentList;
		return left;
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

	function startSorting() {
		mergeSort(items).then((result) => {
			sortedItems = result;
			currentComparison = null;
		});
	}

	function choose(winner: string) {
		resolveCurrentComparison?.(winner);
	}

	function clearAll() {
		items = [];
		sortedItems = [];
		clearStorage(['ranking-items', 'ranking-sorted-items']);
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
		<!-- Add Items Section -->
		<Card class="p-4">
			<h2 class="mb-4 text-xl font-semibold">Add Items</h2>
			<form
				class="flex gap-2"
				onsubmit={(e) => {
					e.preventDefault();
					addItem();
				}}
			>
				<Input type="text" placeholder="Enter an item" bind:value={newItem} class="flex-1" />
				<Button type="submit">Add</Button>
			</form>

			{#if items.length > 0}
				<div class="mt-4">
					<h3 class="mb-2 text-lg font-medium">Current Items:</h3>
					<ul class="space-y-2">
						{#each items as item}
							<li>
								<Card class="p-3">
									<p class="text-sm">{item}</p>
								</Card>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if items.length >= 2 && !currentComparison && !sortedItems.length}
				<Button class="mt-4" onclick={startSorting}>Start Sorting</Button>
			{/if}
		</Card>

		<!-- Comparison Section -->
		{#if currentComparison}
			<Card class="p-4">
				<h2 class="mb-4 text-xl font-semibold">Compare Items</h2>
				<p class="mb-4">Which item do you prefer?</p>
				<div class="flex gap-4">
					<Button class="flex-1" onclick={() => choose(currentComparison!.item1)}>
						{currentComparison.item1}
					</Button>
					<Button class="flex-1" onclick={() => choose(currentComparison!.item2)}>
						{currentComparison.item2}
					</Button>
				</div>
			</Card>
		{/if}

		<!-- Results Section -->
		{#if sortedItems.length > 0}
			<Card class="p-4">
				<h2 class="mb-4 text-xl font-semibold">Final Ranking</h2>
				<form
					class="mb-4 flex gap-2"
					onsubmit={(e) => {
						e.preventDefault();
						insertNewItem();
					}}
				>
					<Input type="text" placeholder="Insert new item" bind:value={insertItem} class="flex-1" />
					<Button type="submit">Insert</Button>
				</form>
				<ol class="space-y-2">
					{#each sortedItems as item, i (item)}
						<li
							class={item === highlightedItem ? 'bg-primary/20 transition-colors duration-500' : ''}
							animate:flip={{ duration: 300 }}
							transition:fade={{ duration: 200 }}
						>
							<Card class="p-3">
								<div class="flex items-center gap-3">
									<span class="text-sm font-medium text-muted-foreground">{i + 1}</span>
									<p class="text-sm">{item}</p>
								</div>
							</Card>
						</li>
					{/each}
				</ol>
			</Card>
		{/if}
	</div>
</main>
