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
	import { localStore } from '$lib/utils/storage.svelte';
	import { onMount } from 'svelte';

	type Ranking = {
		userId: string;
		name: string;
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

	let rankings = localStore<Ranking[]>('collaborative-rankings', []);
	let sortBy = localStore<SortBy>('collaborative-sort-by', 'median');
	let userId = $state(crypto.randomUUID());
	let newRanking = $state('');
	let newRankingName = $state('');
	let validationError = $state<ValidationError | null>(null);
	let editingNameId = $state<string | null>(null);
	let editingNameValue = $state('');

	const sortOptions: { value: SortBy; label: string }[] = [
		{ value: 'median', label: 'Median Position' },
		{ value: 'min', label: 'Best Position' },
		{ value: 'max', label: 'Worst Position' },
		{ value: 'spread', label: 'Position Spread' }
	];

	function validateRanking(items: string[]): ValidationError | null {
		if (rankings.value.length === 0) return null; // First ranking defines the set

		const expectedItems = new Set(rankings.value[0].items);
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
		rankings.value = [
			...rankings.value,
			{ userId, name: newRankingName || `List ${rankings.value.length + 1}`, items }
		];
		newRanking = '';
		newRankingName = '';
		userId = crypto.randomUUID();
	}

	function calculateStats(): ItemStats[] {
		if (rankings.value.length === 0) return [];

		const stats: ItemStats[] = rankings.value[0].items.map((item) => {
			const positions = rankings.value.map((ranking) => ranking.items.indexOf(item) + 1);
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

		return stats.sort((a, b) => a[sortBy.value] - b[sortBy.value]);
	}

	function removeRanking(userId: string) {
		rankings.value = rankings.value.filter((r) => r.userId !== userId);
	}

	function clearAll() {
		rankings.reset();
		sortBy.reset();
		validationError = null;
	}

	function startEditingName(ranking: Ranking) {
		editingNameId = ranking.userId;
		editingNameValue = ranking.name;
	}

	function saveEditingName() {
		if (!editingNameId) return;

		rankings.value = rankings.value.map((ranking) =>
			ranking.userId === editingNameId
				? {
						...ranking,
						name: editingNameValue.trim() || `List ${rankings.value.indexOf(ranking) + 1}`
					}
				: ranking
		);

		editingNameId = null;
		editingNameValue = '';
	}

	function cancelEditingName() {
		editingNameId = null;
		editingNameValue = '';
	}

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		saveEditingName();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			cancelEditingName();
		}
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
					<label for="ranking-name" class="text-sm font-medium">List Name (optional)</label>
					<input
						type="text"
						id="ranking-name"
						bind:value={newRankingName}
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
						placeholder="My ranking list"
					/>
				</div>
				<div class="space-y-2">
					<label for="ranking" class="text-sm font-medium">
						{#if rankings.value.length === 0}
							Paste your ranked items (one per line) - This will define the item set
						{:else}
							Paste your ranked items (one per line) - Must match the original set:
							<div class="mt-1 text-sm text-muted-foreground">
								{rankings.value[0].items.join(', ')}
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

		{#if rankings.value.length > 0}
			<Card class="p-6">
				<div class="mb-6 space-y-4">
					<h2 class="text-xl font-semibold">Combined Statistics</h2>
					<Select type="single" bind:value={sortBy.value}>
						<SelectTrigger>
							{sortOptions.find((opt) => opt.value === sortBy.value)?.label ?? 'Sort by'}
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
												{#if sortBy.value === 'median'}
													Median: {stat.median.toFixed(1)}
												{:else if sortBy.value === 'min'}
													Best: {stat.min}
												{:else if sortBy.value === 'max'}
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
					{#each rankings.value as ranking (ranking.userId)}
						<div class="relative space-y-2" transition:slide>
							<div class="flex items-center justify-between">
								<div>
									{#if editingNameId === ranking.userId}
										<form class="inline-flex items-center gap-2" onsubmit={handleSubmit}>
											<input
												type="text"
												bind:value={editingNameValue}
												class="rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
												placeholder="List name"
												onkeydown={handleKeyDown}
											/>
											<div class="flex gap-1">
												<Button type="submit" variant="ghost" size="icon" class="h-7 w-7">
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
														class="h-4 w-4"
													>
														<polyline points="20 6 9 17 4 12" />
													</svg>
												</Button>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													class="h-7 w-7"
													onclick={cancelEditingName}
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
														class="h-4 w-4"
													>
														<line x1="18" y1="6" x2="6" y2="18" />
														<line x1="6" y1="6" x2="18" y2="18" />
													</svg>
												</Button>
											</div>
										</form>
									{:else}
										<button
											class="inline-flex items-center gap-1 hover:text-muted-foreground"
											onclick={() => startEditingName(ranking)}
										>
											<span class="font-medium">{ranking.name}</span>
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
												class="h-3.5 w-3.5"
											>
												<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
												<path d="m15 5 4 4" />
											</svg>
										</button>
										<span class="ml-2 text-sm text-muted-foreground"
											>({ranking.items.length} items)</span
										>
									{/if}
								</div>
								<Button
									onclick={() => removeRanking(ranking.userId)}
									variant="ghost"
									size="icon"
									class="h-8 w-8"
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
										class="h-4 w-4"
									>
										<path d="M3 6h18" />
										<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
										<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
									</svg>
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
