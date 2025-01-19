<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger
	} from '$lib/components/ui/accordion';
	import { slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { loadFromStorage, saveToStorage, clearStorage } from '$lib/utils/storage';
	import { onMount } from 'svelte';

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

	type SortBy = 'median' | 'min' | 'max' | 'spread';

	type ValidationError = {
		missing: string[];
		extra: string[];
	};

	let rankings = $state<Ranking[]>([]);
	let userId = $state(crypto.randomUUID());
	let newRanking = $state('');
	let sortBy = $state<SortBy>('median');
	let validationError = $state<ValidationError | null>(null);

	const sortOptions: { value: SortBy; label: string }[] = [
		{ value: 'median', label: 'Median Position' },
		{ value: 'min', label: 'Best Position' },
		{ value: 'max', label: 'Worst Position' },
		{ value: 'spread', label: 'Position Spread' }
	];

	onMount(() => {
		rankings = loadFromStorage('collaborative-rankings', []);
		sortBy = loadFromStorage('collaborative-sort-by', 'median');
	});

	$effect(() => {
		saveToStorage('collaborative-rankings', rankings);
		saveToStorage('collaborative-sort-by', sortBy);
	});

	function validateRanking(items: string[]): ValidationError | null {
		if (rankings.length === 0) return null; // First ranking defines the set

		const expectedItems = new Set(rankings[0].items);
		const newItems = new Set(items);

		const missing: string[] = [];
		const extra: string[] = [];

		// Find missing items
		expectedItems.forEach((item) => {
			if (!newItems.has(item)) {
				missing.push(item);
			}
		});

		// Find extra items
		newItems.forEach((item) => {
			if (!expectedItems.has(item)) {
				extra.push(item);
			}
		});

		if (missing.length > 0 || extra.length > 0) {
			return { missing, extra };
		}

		return null;
	}

	function addRanking() {
		if (!newRanking.trim()) return;

		const items = newRanking
			.split('\n')
			.map((item) => item.trim())
			.filter((item) => item.length > 0);

		if (items.length === 0) return;

		const error = validateRanking(items);
		if (error) {
			validationError = error;
			return;
		}

		validationError = null;
		rankings = [...rankings, { userId, items }];
		newRanking = '';
		userId = crypto.randomUUID();
	}

	function calculateStats(): ItemStats[] {
		if (rankings.length === 0) return [];

		const stats: ItemStats[] = rankings[0].items.map((item) => {
			const positions = rankings.map((ranking) => ranking.items.indexOf(item) + 1);
			const sorted = positions.sort((a, b) => a - b);
			const mid = Math.floor(sorted.length / 2);
			const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

			return {
				item,
				median,
				min: sorted[0],
				max: sorted[sorted.length - 1],
				spread: sorted[sorted.length - 1] - sorted[0]
			};
		});

		return stats.sort((a, b) => a[sortBy] - b[sortBy]);
	}

	function removeRanking(userId: string) {
		rankings = rankings.filter((r) => r.userId !== userId);
	}

	function clearAll() {
		rankings = [];
		sortBy = 'median';
		validationError = null;
		clearStorage(['collaborative-rankings', 'collaborative-sort-by']);
	}
</script>

<main class="container mx-auto max-w-4xl p-4">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Collaborative Ranking</h1>
		<Button onclick={clearAll} variant="destructive">Clear All</Button>
	</div>

	<div class="grid gap-8 md:grid-cols-2">
		<Card class="p-6">
			<h2 class="mb-4 text-xl font-semibold">Add Your Ranking</h2>
			<div class="space-y-4">
				<div class="space-y-2">
					<label for="ranking" class="text-sm font-medium">
						{#if rankings.length === 0}
							Paste your ranked items (one per line) - This will define the item set
						{:else}
							Paste your ranked items (one per line) - Must match the original set:
							<div class="mt-1 text-sm text-muted-foreground">
								{rankings[0].items.join(', ')}
							</div>
						{/if}
					</label>
					<Textarea
						id="ranking"
						bind:value={newRanking}
						rows={10}
						placeholder="1. First item&#10;2. Second item&#10;3. Third item"
					/>
					{#if validationError}
						<div class="rounded-md bg-destructive/15 p-3 text-sm text-destructive" transition:slide>
							<strong>Invalid ranking:</strong>
							{#if validationError.missing.length > 0}
								<div>Missing items: {validationError.missing.join(', ')}</div>
							{/if}
							{#if validationError.extra.length > 0}
								<div>Extra items: {validationError.extra.join(', ')}</div>
							{/if}
						</div>
					{/if}
				</div>
				<Button onclick={addRanking} class="w-full">Add Ranking</Button>
			</div>
		</Card>

		{#if rankings.length > 0}
			<Card class="p-6">
				<div class="mb-6 space-y-4">
					<h2 class="text-xl font-semibold">Combined Statistics</h2>
					<Select type="single" bind:value={sortBy}>
						<SelectTrigger>
							{sortOptions.find((opt) => opt.value === sortBy)?.label ?? 'Sort by'}
						</SelectTrigger>
						<SelectContent>
							{#each sortOptions as option}
								<SelectItem value={option.value}>{option.label}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>
				<div class="space-y-2">
					<Accordion type="single">
						{#each calculateStats() as stat (stat.item)}
							<div animate:flip={{ duration: 300 }}>
								<AccordionItem value={stat.item}>
									<AccordionTrigger>
										<div class="flex w-full items-center justify-between pr-4">
											<span>{stat.item}</span>
											<span class="text-sm font-medium">
												{#if sortBy === 'median'}
													Median: {stat.median.toFixed(1)}
												{:else if sortBy === 'min'}
													Best: {stat.min}
												{:else if sortBy === 'max'}
													Worst: {stat.max}
												{:else}
													Spread: {stat.spread}
												{/if}
											</span>
										</div>
									</AccordionTrigger>
									<AccordionContent>
										<div class="grid grid-cols-2 gap-2 rounded-md bg-muted p-2 text-sm">
											<div>
												<span class="text-muted-foreground">Median:</span>
												<span class="font-medium">{stat.median.toFixed(1)}</span>
											</div>
											<div>
												<span class="text-muted-foreground">Best:</span>
												<span class="font-medium">{stat.min}</span>
											</div>
											<div>
												<span class="text-muted-foreground">Worst:</span>
												<span class="font-medium">{stat.max}</span>
											</div>
											<div>
												<span class="text-muted-foreground">Spread:</span>
												<span class="font-medium">{stat.spread}</span>
											</div>
										</div>
									</AccordionContent>
								</AccordionItem>
							</div>
						{/each}
					</Accordion>
				</div>
			</Card>

			<Card class="p-6 md:col-span-2">
				<h2 class="mb-4 text-xl font-semibold">Individual Rankings</h2>
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each rankings as ranking (ranking.userId)}
						<div class="relative space-y-2" transition:slide>
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
