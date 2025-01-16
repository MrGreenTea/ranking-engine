<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card } from '$lib/components/ui/card';

	let items = $state<string[]>([]);
	let currentComparison = $state<{ item1: string; item2: string } | null>(null);
	let newItem = $state('');
	let sortedItems = $state<string[]>([]);
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

		while (leftIndex < left.length && rightIndex < right.length) {
			const item1 = left[leftIndex];
			const item2 = right[rightIndex];

			currentComparison = { item1, item2 };
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

	function startSorting() {
		mergeSort(items).then((result) => {
			sortedItems = result;
			currentComparison = null;
		});
	}

	function choose(winner: string) {
		resolveCurrentComparison?.(winner);
	}

	$effect(() => {
		if (items.length >= 2 && !currentComparison) {
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
				<ol class="list-decimal pl-5">
					{#each sortedItems as item}
						<li>{item}</li>
					{/each}
				</ol>
			</Card>
		{/if}
	</div>
</main>
