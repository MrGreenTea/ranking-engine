<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card } from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	type Ranking = {
		userId: string;
		items: string[];
	};

	type ItemStats = {
		item: string;
		median: number;
		min: number;
		max: number;
		spread: number;
	};

	let rankings = $state<Ranking[]>([]);
	let userId = $state(crypto.randomUUID());
	let newRanking = $state('');

	function addRanking() {
		if (!newRanking.trim()) return;

		const items = newRanking
			.split('\n')
			.map((item) => item.trim())
			.filter((item) => item.length > 0);

		if (items.length === 0) return;

		rankings = [...rankings, { userId, items }];
		newRanking = '';
		userId = crypto.randomUUID(); // Generate new ID for next ranking
	}

	function calculateStats(): ItemStats[] {
		if (rankings.length === 0) return [];

		// Get unique items from all rankings
		const uniqueItems = new Set<string>();
		rankings.forEach((ranking) => {
			ranking.items.forEach((item) => uniqueItems.add(item));
		});

		const stats: ItemStats[] = Array.from(uniqueItems).map((item) => {
			const positions = rankings
				.map((ranking) => {
					const index = ranking.items.indexOf(item);
					return index === -1 ? ranking.items.length : index + 1;
				})
				.filter((pos) => pos > 0);

			const sorted = [...positions].sort((a, b) => a - b);
			const mid = Math.floor(sorted.length / 2);
			const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

			return {
				item,
				median,
				min: Math.min(...positions),
				max: Math.max(...positions),
				spread: Math.max(...positions) - Math.min(...positions)
			};
		});

		return stats.sort((a, b) => a.median - b.median);
	}

	function removeRanking(userId: string) {
		rankings = rankings.filter((r) => r.userId !== userId);
	}
</script>

<main class="container mx-auto max-w-4xl p-4">
	<h1 class="mb-8 text-3xl font-bold">Collaborative Ranking</h1>

	<div class="grid gap-8 md:grid-cols-2">
		<Card class="p-6">
			<h2 class="mb-4 text-xl font-semibold">Add Your Ranking</h2>
			<div class="space-y-4">
				<div class="space-y-2">
					<label for="ranking" class="text-sm font-medium">
						Paste your ranked items (one per line)
					</label>
					<Textarea
						id="ranking"
						bind:value={newRanking}
						rows={10}
						placeholder="1. First item&#10;2. Second item&#10;3. Third item"
					/>
				</div>
				<Button onclick={addRanking} class="w-full">Add Ranking</Button>
			</div>
		</Card>

		{#if rankings.length > 0}
			<Card class="p-6">
				<h2 class="mb-4 text-xl font-semibold">Combined Statistics</h2>
				<div class="space-y-4">
					{#each calculateStats() as stat (stat.item)}
						<div
							class="flex items-center justify-between"
							animate:flip={{ duration: 300 }}
							transition:fade
						>
							<span>{stat.item}</span>
							<div class="text-sm">
								<span class="font-medium">Median: {stat.median.toFixed(1)}</span>
								<span class="text-muted-foreground">
									(Range: {stat.min}-{stat.max}, Spread: {stat.spread})
								</span>
							</div>
						</div>
					{/each}
				</div>
			</Card>

			<Card class="p-6 md:col-span-2">
				<h2 class="mb-4 text-xl font-semibold">Individual Rankings</h2>
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each rankings as ranking (ranking.userId)}
						<div class="relative space-y-2" transition:fade>
							<div class="flex items-center justify-between">
								<h3 class="font-medium">Ranking {rankings.indexOf(ranking) + 1}</h3>
								<Button
									onclick={() => removeRanking(ranking.userId)}
									variant="ghost"
									class="h-8 w-8 p-0"
								>
									✕
								</Button>
							</div>
							<ol class="list-decimal pl-6">
								{#each ranking.items as item}
									<li>{item}</li>
								{/each}
							</ol>
						</div>
					{/each}
				</div>
			</Card>
		{/if}
	</div>
</main>
