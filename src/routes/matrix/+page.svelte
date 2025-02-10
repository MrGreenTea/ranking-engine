<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import { Textarea } from '$lib/components/ui/textarea';
	import { localStore } from '$lib/utils/storage.svelte';

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
	let hoveredCell = $state<null | string>(null);

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
	}

	function clearAll() {
		rankings.reset();
		validationError = null;
		newRanking = '';
		newRankingName = '';
		currentAxis = 'x';
	}

	const matrixData: { label: string; x: number; y: number }[] = $derived.by(() => {
		if (rankings.value.length < 2) return [];
		const [firstRanking, secondRanking] = rankings.value;

		// to prevent modifying the original arrays, we make copies
		// otherwise we get a reactivity loop
		const firstRankingItems = [...firstRanking.items];

		// we want the top right corner to be the highest rank in both lists
		// but because x counts from the left and y from the top, we need to swap the coordinates
		firstRankingItems.reverse();

		return firstRankingItems.map((item) => ({
			label: item,
			// 1-indexed to not overlap with the border
			x: firstRankingItems.indexOf(item) + 1,
			y: secondRanking.items.indexOf(item) + 1
		}));
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
				<div class="relative h-[600px] w-[600px] flex-1 border-2 border-indigo-50 p-2">
					<div class="absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 bg-indigo-50"></div>
					<div class="absolute left-1/2 top-0 h-full w-2 -translate-x-1/2 bg-indigo-50"></div>
					<div
						class="relative z-10 grid h-full w-full"
						style="grid-template-columns: repeat({matrixData.length + 1}, 1fr);
							 grid-template-rows: repeat({matrixData.length + 1}, 1fr);"
					>
						{#each matrixData as data}
							<HoverCard.Root openDelay={200}>
								<HoverCard.Trigger
									onmouseenter={() => (hoveredCell = data.label)}
									onmouseleave={() => (hoveredCell = null)}
									aria-label={data.label}
									style="grid-column-start: {data.x}; grid-row-start: {data.y};"
									class={[
										'h-full w-full rounded-full bg-indigo-400 transition-all duration-100 hover:bg-indigo-600',
										hoveredCell === data.label && 'bg-indigo-600'
									]}
								></HoverCard.Trigger>
								<HoverCard.Content>{data.label}</HoverCard.Content>
							</HoverCard.Root>
						{/each}
					</div>

					<h3
						class="text-vertical absolute -right-7 top-1/2 -translate-y-1/2 text-center text-lg font-semibold"
					>
						{rankings.value[1].name}
					</h3>

					<h3
						class="absolute -bottom-10 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-lg font-semibold"
					>
						{rankings.value[0].name}
					</h3>
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
									<li
										onmouseenter={() => (hoveredCell = item)}
										onmouseleave={() => (hoveredCell = null)}
										class:bg-muted={hoveredCell === item}
									>
										{item}
									</li>
								{/each}
							</ol>
						</div>
					{/each}
				</div>
			</Card>
		{/if}
	</div>
</div>

<style>
	.text-vertical {
		writing-mode: vertical-rl;
		text-orientation: mixed;
	}
</style>
