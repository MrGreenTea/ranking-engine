<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card } from '$lib/components/ui/card';
	import { writable } from 'svelte/store';

	const items = writable<string[]>([]);
	const comparisons = writable<Record<string, Record<string, boolean>>>({});
	const currentComparison = writable<{ item1: string; item2: string } | null>(null);
	let newItem = '';

	function addItem() {
		if (newItem.trim()) {
			$items = [...$items, newItem.trim()];
			newItem = '';
		}
	}

	function startComparisons() {
		if ($items.length < 2) return;

		// Check if all comparisons are done
		let allCompared = true;
		let foundComparison = false;

		for (let i = 0; i < $items.length; i++) {
			for (let j = i + 1; j < $items.length; j++) {
				const item1 = $items[i];
				const item2 = $items[j];
				if (!$comparisons[item1]?.[item2] && !$comparisons[item2]?.[item1]) {
					allCompared = false;
					if (!foundComparison) {
						$currentComparison = { item1, item2 };
						foundComparison = true;
					}
				}
			}
		}

		if (allCompared) {
			$currentComparison = null;
		}
	}

	function choose(winner: string, loser: string) {
		$comparisons = {
			...$comparisons,
			[winner]: { ...($comparisons[winner] || {}), [loser]: true }
		};
		startComparisons();
	}

	function getRanking(): string[] {
		const scores = new Map<string, number>();

		// Initialize scores
		$items.forEach((item) => scores.set(item, 0));

		// Calculate wins for each item
		$items.forEach((item1) => {
			$items.forEach((item2) => {
				if (item1 !== item2 && $comparisons[item1]?.[item2]) {
					scores.set(item1, scores.get(item1)! + 1);
				}
			});
		});

		// Sort items by score
		return [...$items].sort((a, b) => scores.get(b)! - scores.get(a)!);
	}
</script>

<main class="container mx-auto max-w-2xl p-4">
	<h1 class="mb-8 text-3xl font-bold">Ranking Engine</h1>

	<div class="space-y-8">
		<!-- Add Items Section -->
		<Card class="p-4">
			<h2 class="mb-4 text-xl font-semibold">Add Items</h2>
			<form
				class="flex gap-2"
				on:submit|preventDefault={() => {
					addItem();
				}}
			>
				<Input type="text" placeholder="Enter an item" bind:value={newItem} class="flex-1" />
				<Button type="submit">Add</Button>
			</form>

			{#if $items.length > 0}
				<div class="mt-4">
					<h3 class="mb-2 text-lg font-medium">Current Items:</h3>
					<ul class="list-disc pl-5">
						{#each $items as item}
							<li>{item}</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if $items.length >= 2 && !$currentComparison}
				<Button class="mt-4" onclick={startComparisons}>Start Comparing</Button>
			{/if}
		</Card>

		<!-- Comparison Section -->
		{#if $currentComparison}
			<Card class="p-4">
				<h2 class="mb-4 text-xl font-semibold">Compare Items</h2>
				<p class="mb-4">Which item do you prefer?</p>
				<div class="flex gap-4">
					<Button
						class="flex-1"
						onclick={() => {
							if ($currentComparison) {
								choose($currentComparison.item1, $currentComparison.item2);
							}
						}}
					>
						{$currentComparison?.item1}
					</Button>
					<Button
						class="flex-1"
						onclick={() => {
							if ($currentComparison) {
								choose($currentComparison.item2, $currentComparison.item1);
							}
						}}
					>
						{$currentComparison?.item2}
					</Button>
				</div>
			</Card>
		{/if}

		<!-- Results Section -->
		{#if Object.keys($comparisons).length > 0}
			<Card class="p-4">
				<h2 class="mb-4 text-xl font-semibold">Current Ranking</h2>
				<ol class="list-decimal pl-5">
					{#each getRanking() as item}
						<li class="mb-1">{item}</li>
					{/each}
				</ol>
			</Card>
		{/if}
	</div>
</main>
