<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card } from '$lib/components/ui/card';

	let items = $state<string[]>([]);
	let currentComparison = $state<{ item1: string; item2: string } | null>(null);
	let newItem = $state('');
	let sortedItems = $state<string[]>([]);
	let mergeSortState = $state<{
		leftArray: string[];
		rightArray: string[];
		mergeIndex: number;
		leftIndex: number;
		rightIndex: number;
		result: string[];
	} | null>(null);

	let resolveCurrentComparison: ((value: string) => void) | null = null;

	function addItem() {
		if (newItem.trim()) {
			items = [...items, newItem.trim()];
			newItem = '';
		}
	}

	async function mergeArrays(left: string[], right: string[]): Promise<string[]> {
		const result: string[] = [];
		let leftIndex = 0;
		let rightIndex = 0;

		// Initialize merge state
		mergeSortState = {
			leftArray: left,
			rightArray: right,
			mergeIndex: 0,
			leftIndex,
			rightIndex,
			result
		};

		while (leftIndex < left.length && rightIndex < right.length) {
			const item1 = left[leftIndex];
			const item2 = right[rightIndex];

			// Set up the comparison
			currentComparison = { item1, item2 };

			// Wait for user choice
			const choice = await new Promise<string>((resolve) => {
				resolveCurrentComparison = resolve;
			});

			currentComparison = null;
			resolveCurrentComparison = null;

			if (choice === item1) {
				result.push(item1);
				leftIndex++;
			} else {
				result.push(item2);
				rightIndex++;
			}

			// Update merge state
			mergeSortState = {
				leftArray: left,
				rightArray: right,
				mergeIndex: result.length,
				leftIndex,
				rightIndex,
				result
			};
		}

		// Add remaining elements
		while (leftIndex < left.length) {
			result.push(left[leftIndex]);
			leftIndex++;
			mergeSortState.leftIndex = leftIndex;
			mergeSortState.result = [...result];
		}

		while (rightIndex < right.length) {
			result.push(right[rightIndex]);
			rightIndex++;
			mergeSortState.rightIndex = rightIndex;
			mergeSortState.result = [...result];
		}

		mergeSortState = null;
		return result;
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

	function startSorting() {
		// Start the merge sort process
		mergeSort(items).then((result) => {
			sortedItems = result;
		});
	}

	function choose(winner: string) {
		if (resolveCurrentComparison) {
			resolveCurrentComparison(winner);
		}
	}

	$effect(() => {
		if (items.length >= 2 && !currentComparison && !mergeSortState) {
			sortedItems = [];
		}
	});
</script>

<main class="container mx-auto max-w-2xl p-4">
	<h1 class="mb-8 text-3xl font-bold">Ranking Engine</h1>

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
					<ul class="list-disc pl-5">
						{#each items as item}
							<li>{item}</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if items.length >= 2 && !currentComparison}
				<Button class="mt-4" onclick={startSorting}>Start Sorting</Button>
			{/if}
		</Card>

		<!-- Comparison Section -->
		{#if currentComparison}
			<Card class="p-4">
				<h2 class="mb-4 text-xl font-semibold">Compare Items</h2>
				<p class="mb-4">Which item do you prefer?</p>
				<div class="flex gap-4">
					<Button
						class="flex-1"
						onclick={() => {
							choose(currentComparison!.item1);
						}}
					>
						{currentComparison.item1}
					</Button>
					<Button
						class="flex-1"
						onclick={() => {
							choose(currentComparison!.item2);
						}}
					>
						{currentComparison.item2}
					</Button>
				</div>
			</Card>
		{/if}

		<!-- Progress Section -->
		{#if mergeSortState}
			<Card class="p-4">
				<h2 class="mb-4 text-xl font-semibold">Sorting Progress</h2>
				<div class="space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<div>
							<h3 class="mb-2 text-lg font-medium">Left Array</h3>
							<ul class="list-disc pl-5">
								{#each mergeSortState.leftArray as item, i}
									<li class={i < mergeSortState.leftIndex ? 'text-gray-400' : ''}>
										{item}
									</li>
								{/each}
							</ul>
						</div>
						<div>
							<h3 class="mb-2 text-lg font-medium">Right Array</h3>
							<ul class="list-disc pl-5">
								{#each mergeSortState.rightArray as item, i}
									<li class={i < mergeSortState.rightIndex ? 'text-gray-400' : ''}>
										{item}
									</li>
								{/each}
							</ul>
						</div>
					</div>
					<div>
						<h3 class="mb-2 text-lg font-medium">Merged Result</h3>
						<ul class="list-decimal pl-5">
							{#each mergeSortState.result as item}
								<li>{item}</li>
							{/each}
						</ul>
					</div>
				</div>
			</Card>
		{/if}

		<!-- Results Section -->
		{#if sortedItems.length > 0}
			<Card class="p-4">
				<h2 class="mb-4 text-xl font-semibold">Final Ranking</h2>
				<ol class="list-decimal pl-5">
					{#each sortedItems as item}
						<li class="mb-1">{item}</li>
					{/each}
				</ol>
			</Card>
		{/if}
	</div>
</main>
