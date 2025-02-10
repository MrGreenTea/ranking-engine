<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import { localStore } from '$lib/utils/storage.svelte';
	import Chart from 'chart.js/auto';
	import { onMount } from 'svelte';

	let chartCanvas = $state<HTMLCanvasElement>();
	let chart: Chart;

	type Ranking = {
		items: string[];
		name: string;
	};

	type ValidationError = {
		extra: string[];
		missing: string[];
	};

	let rankings = localStore<Ranking[]>('matrix-rankings', []);
	let newRanking = $state('');
	let newRankingName = $state('');
	let validationError = $state<null | ValidationError>(null);
	let currentAxis = $state<'x' | 'y'>('x');

	function validateRanking(items: string[]): null | ValidationError {
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
			return { extra, missing };
		}

		return null;
	}

	function addRanking() {
		if (!newRanking.trim() || !newRankingName.trim()) return;
		if (rankings.value.length >= 2) return;

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
			{
				items,
				name: newRankingName
			}
		];

		newRanking = '';
		newRankingName = '';
		currentAxis = 'y';
		updateChart();
	}

	function clearAll() {
		rankings.reset();
		validationError = null;
		newRanking = '';
		newRankingName = '';
		currentAxis = 'x';
		if (chart) {
			chart.destroy();
		}
	}

	function getPositionInRanking(items: string[]): Record<string, number> {
		return items.reduce((acc, item, index) => ({ ...acc, [item]: index }), {});
	}

	function updateChart() {
		if (rankings.value.length < 2) return;
		if (!chartCanvas) return;
		if (chart) {
			chart.destroy();
		}

		const ctx = chartCanvas.getContext('2d');
		if (!ctx) return;

		const firstRanking = rankings.value[0];
		const secondRanking = rankings.value[1];

		const firstPositions = getPositionInRanking(firstRanking.items);
		const secondPositions = getPositionInRanking(secondRanking.items);

		const matrixData = firstRanking.items.map((item) => ({
			label: item,
			x: firstPositions[item],
			y: secondPositions[item]
		}));

		chart = new Chart(ctx, {
			data: {
				datasets: [
					{
						backgroundColor: 'rgb(99, 102, 241)',
						borderColor: 'rgb(79, 82, 221)',
						data: matrixData,
						pointHoverRadius: 8,
						pointRadius: 5
					}
				]
			},
			options: {
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						callbacks: {
							label: (context) => {
								const dataPoint = context.raw as (typeof matrixData)[number];
								return `${dataPoint.label} (${dataPoint.x}, ${dataPoint.y})`;
							}
						}
					}
				},
				responsive: true,
				scales: {
					x: {
						max: firstRanking.items.length + 0.5,
						min: -1.5,
						reverse: true,
						ticks: {
							display: false,
							stepSize: secondRanking.items.length / 2
						},
						title: {
							display: true,
							text: firstRanking.name
						}
					},
					y: {
						max: secondRanking.items.length + 0.5,
						min: -1.5,
						reverse: true,
						ticks: {
							display: false,
							stepSize: secondRanking.items.length / 2
						},
						title: {
							display: true,
							text: secondRanking.name
						}
					}
				}
			},
			type: 'scatter'
		});
	}

	$effect(() => {
		if (rankings.value.length >= 2) {
			updateChart();
		}
	});

	onMount(() => {
		if (rankings.value.length >= 2) {
			updateChart();
		}
		return () => {
			if (chart) {
				chart.destroy();
			}
		};
	});
</script>

<div class="container mx-auto p-4">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-3xl font-bold">Matrix Visualization</h1>
		<Button onclick={clearAll} variant="destructive">Clear All</Button>
	</div>

	<div class="grid gap-8 md:grid-cols-2">
		{#if rankings.value.length < 2}
			<Card class="p-6">
				<h2 class="mb-4 text-xl font-semibold">
					Add {currentAxis === 'x' ? 'X-Axis' : 'Y-Axis'} Ranking
				</h2>
				<div class="space-y-4">
					<div class="space-y-2">
						<label for="rankingName" class="text-sm font-medium">Ranking Name</label>
						<input
							id="rankingName"
							bind:value={newRankingName}
							class="w-full rounded-md border px-3 py-2"
							placeholder={currentAxis === 'x' ? 'e.g., Importance' : 'e.g., Urgency'}
						/>
					</div>
					<div class="space-y-2">
						<label for="ranking" class="text-sm font-medium">Items (one per line)</label>
						<Textarea
							id="ranking"
							bind:value={newRanking}
							class="font-mono"
							placeholder="Item 1&#10;Item 2&#10;Item 3"
							rows={10}
						/>
					</div>

					{#if validationError}
						<div class="rounded-md bg-red-50 p-4 text-sm text-red-900">
							<h3 class="font-medium">Validation Error</h3>
							{#if validationError.missing.length > 0}
								<p>Missing items:</p>
								<ul class="list-inside list-disc">
									{#each validationError.missing as item}
										<li>{item}</li>
									{/each}
								</ul>
							{/if}
							{#if validationError.extra.length > 0}
								<p>Extra items:</p>
								<ul class="list-inside list-disc">
									{#each validationError.extra as item}
										<li>{item}</li>
									{/each}
								</ul>
							{/if}
						</div>
					{/if}

					<Button onclick={addRanking} disabled={!newRanking.trim() || !newRankingName.trim()}>
						Add {currentAxis === 'x' ? 'X-Axis' : 'Y-Axis'} Ranking
					</Button>

					{#if rankings.value.length === 0}
						<p class="text-sm text-gray-600">
							Add your first ranking for the X-axis. This will define the set of items that can be
							ranked.
						</p>
					{:else}
						<p class="text-sm text-gray-600">
							Add the Y-axis ranking to see the matrix visualization.
						</p>
					{/if}
				</div>
			</Card>
		{/if}

		{#if rankings.value.length >= 2}
			<Card class="p-6">
				<h2 class="mb-4 text-xl font-semibold">Matrix View</h2>
				<div class="h-[600px] w-full">
					<canvas bind:this={chartCanvas}></canvas>
				</div>
				<p class="mt-4 text-sm text-gray-600">
					Items are positioned based on their rank in both lists. The top-right corner represents
					items ranked highly in both lists.
				</p>
			</Card>
		{/if}

		{#if rankings.value.length > 0}
			<Card class="p-6 {rankings.value.length < 2 ? '' : 'md:col-span-2'}">
				<h2 class="mb-4 text-xl font-semibold">Current Rankings</h2>
				<div class="grid gap-4 md:grid-cols-2">
					{#each rankings.value as ranking, i}
						<div class="space-y-2">
							<h3 class="font-medium">{i === 0 ? 'X-Axis: ' : 'Y-Axis: '}{ranking.name}</h3>
							<ol class="list-inside list-decimal space-y-1">
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
</div>
