<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card } from '$lib/components/ui/card';

	let items = $state<string[]>([]);
	let comparisons = $state<Record<string, Record<string, boolean>>>({});
	let currentComparison = $state<{ item1: string; item2: string } | null>(null);
	let newItem = $state('');

	function addItem() {
		if (newItem.trim()) {
			items = [...items, newItem.trim()];
			newItem = '';
		}
	}

	function canDeduce(item1: string, item2: string, visited = new Set<string>()): boolean {
		// If we've already visited this item, stop to prevent infinite loops
		if (visited.has(item1)) return false;
		visited.add(item1);

		// Direct comparison exists
		if (comparisons[item1]?.[item2]) return true;

		// Check transitive relationships
		for (const [intermediateItem, isGreater] of Object.entries(comparisons[item1] || {})) {
			if (isGreater && canDeduce(intermediateItem, item2, visited)) {
				return true;
			}
		}

		return false;
	}

	function updateTransitiveRelations(winner: string, loser: string) {
		// Items that winner is better than (directly or transitively)
		const winnerBeats = new Set<string>();
		// Items that are better than loser (directly or transitively)
		const beatsLoser = new Set<string>();

		// Find all items that the winner beats
		for (const item of items) {
			if (canDeduce(winner, item)) {
				winnerBeats.add(item);
			}
		}

		// Find all items that beat the loser
		for (const item of items) {
			if (canDeduce(item, loser)) {
				beatsLoser.add(item);
			}
		}

		// Update transitive relationships
		const newComparisons = { ...comparisons };
		for (const item of beatsLoser) {
			if (!newComparisons[item]) newComparisons[item] = {};
			for (const beatenItem of winnerBeats) {
				newComparisons[item][beatenItem] = true;
			}
		}
		comparisons = newComparisons;
	}

	function startComparisons() {
		if (items.length < 2) return;
		
		// Check if all necessary comparisons are done
		let foundComparison = false;
		
		for (let i = 0; i < items.length && !foundComparison; i++) {
			for (let j = i + 1; j < items.length && !foundComparison; j++) {
				const item1 = items[i];
				const item2 = items[j];
				
				// Skip if we can deduce the relationship
				if (!canDeduce(item1, item2) && !canDeduce(item2, item1)) {
					currentComparison = { item1, item2 };
					foundComparison = true;
				}
			}
		}
		
		if (!foundComparison) {
			currentComparison = null;
		}
	}

	function choose(winner: string, loser: string) {
		const newComparisons = { ...comparisons };
		if (!newComparisons[winner]) newComparisons[winner] = {};
		newComparisons[winner][loser] = true;
		comparisons = newComparisons;
		
		// Update transitive relations
		updateTransitiveRelations(winner, loser);
		
		startComparisons();
	}

	function getRanking(): string[] {
		const scores = new Map<string, number>();
		
		// Initialize scores
		items.forEach((item: string) => scores.set(item, 0));
		
		// Calculate wins for each item (including transitive wins)
		items.forEach((item1: string) => {
			items.forEach((item2: string) => {
				if (item1 !== item2 && canDeduce(item1, item2)) {
					scores.set(item1, scores.get(item1)! + 1);
				}
			});
		});
		
		// Sort items by score
		return [...items].sort((a, b) => scores.get(b)! - scores.get(a)!);
	}

	$effect(() => {
		if (items.length >= 2 && !currentComparison) {
			startComparisons();
		}
	});
</script>

<main class="container mx-auto p-4 max-w-2xl">
	<h1 class="text-3xl font-bold mb-8">Ranking Engine</h1>

	<div class="space-y-8">
		<!-- Add Items Section -->
		<Card class="p-4">
			<h2 class="text-xl font-semibold mb-4">Add Items</h2>
			<form
				class="flex gap-2"
				onsubmit={(e) => {
					e.preventDefault();
					addItem();
				}}
			>
				<Input
					type="text"
					placeholder="Enter an item"
					bind:value={newItem}
					class="flex-1"
				/>
				<Button type="submit">Add</Button>
			</form>

			{#if items.length > 0}
				<div class="mt-4">
					<h3 class="text-lg font-medium mb-2">Current Items:</h3>
					<ul class="list-disc pl-5">
						{#each items as item}
							<li>{item}</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if items.length >= 2 && !currentComparison}
				<Button class="mt-4" onclick={startComparisons}>Start Comparing</Button>
			{/if}
		</Card>

		<!-- Comparison Section -->
		{#if currentComparison}
			<Card class="p-4">
				<h2 class="text-xl font-semibold mb-4">Compare Items</h2>
				<p class="mb-4">Which item do you prefer?</p>
				<div class="flex gap-4">
					<Button
						class="flex-1"
						onclick={() => {
							if (currentComparison) {
								choose(currentComparison.item1, currentComparison.item2);
							}
						}}
					>
						{currentComparison?.item1}
					</Button>
					<Button
						class="flex-1"
						onclick={() => {
							if (currentComparison) {
								choose(currentComparison.item2, currentComparison.item1);
							}
						}}
					>
						{currentComparison?.item2}
					</Button>
				</div>
			</Card>
		{/if}

		<!-- Results Section -->
		{#if Object.keys(comparisons).length > 0}
			<Card class="p-4">
				<h2 class="text-xl font-semibold mb-4">Current Ranking</h2>
				<ol class="list-decimal pl-5">
					{#each getRanking() as item}
						<li class="mb-1">{item}</li>
					{/each}
				</ol>
			</Card>
		{/if}
	</div>
</main>
