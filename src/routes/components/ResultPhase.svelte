<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import Button from '$lib/components/ui/button/button.svelte';
	import { flip } from 'svelte/animate';
	import { Input } from '$lib/components/ui/input';
	import { fade } from 'svelte/transition';

	import { binaryInsert } from '$lib/binary-insert';

	type Phase = 'create' | 'compare' | 'result';

	let {
		topK,
		comparisonsCount,
		estimatedComparisons,
		sortedItems,
		remainingItems,
		compareItems,
		phase = $bindable()
	}: {
		topK: number | null;
		comparisonsCount: number;
		estimatedComparisons: number;
		sortedItems: string[];
		remainingItems: string[];
		compareItems: (a: string, b: string) => Promise<number>;
		phase: Phase;
	} = $props();

	let insertItem = $state('');
	let highlightedItem = $state<string | null>(null);

	async function copyList() {
		try {
			await navigator.clipboard.writeText(sortedItems.join('\n'));
		} catch (err) {
			console.error('Failed to copy list:', err);
		}
	}

	function removeSortedItem(item: string) {
		sortedItems = sortedItems.filter((i) => i !== item);
	}

	async function insertNewItem() {
		const trimmedItem = insertItem.trim();
		if (trimmedItem && !sortedItems.includes(trimmedItem)) {
			const currentPhase = phase;
			phase = 'compare';
			await binaryInsert(trimmedItem, sortedItems, compareItems);
			phase = currentPhase;
			insertItem = '';
			// Briefly highlight the newly inserted item
			highlightedItem = trimmedItem;
			setTimeout(() => {
				highlightedItem = null;
			}, 1000);
		}
	}
</script>

<Card class="p-6">
	<div class="mb-4 space-y-2">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-semibold">
				{#if topK !== null && topK > 0}
					Top {topK} Items
				{:else}
					Sorted List
				{/if}
			</h2>
			<Button onclick={copyList} variant="outline" class="gap-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path
						d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
					/></svg
				>
				Copy List
			</Button>
		</div>
		<div class="space-y-1 text-sm text-muted-foreground">
			<p>Actual comparisons: {comparisonsCount} / {estimatedComparisons}</p>
		</div>
	</div>

	<div class="space-y-4">
		<ul class="space-y-2">
			{#each sortedItems as item (item)}
				<li
					animate:flip={{ duration: 300 }}
					transition:fade={{ duration: 200 }}
					class:highlight={item === highlightedItem}
				>
					<Card class="flex items-center justify-between gap-3 p-3" data-testid="sorted-item">
						<p class="flex-1 text-sm">{item}</p>
						<Button onclick={() => removeSortedItem(item)} variant="ghost" size="icon">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
							>
						</Button>
					</Card>
				</li>
			{/each}
		</ul>

		{#if remainingItems.length > 0}
			<div class="my-4 flex items-center gap-4">
				<div class="h-px flex-1 bg-border"></div>
				<p class="text-sm text-muted-foreground">Remaining Items</p>
				<div class="h-px flex-1 bg-border"></div>
			</div>

			<ul class="space-y-2">
				{#each remainingItems as item (item)}
					<li animate:flip={{ duration: 300 }} transition:fade={{ duration: 200 }}>
						<Card class="flex items-center justify-between gap-3 bg-muted p-3">
							<p class="flex-1 text-sm">{item}</p>
						</Card>
					</li>
				{/each}
			</ul>
		{/if}

		<div class="flex gap-2">
			<Input
				bind:value={insertItem}
				placeholder="Insert new item..."
				onkeydown={(e) => e.key === 'Enter' && insertNewItem()}
			/>
			<Button onclick={insertNewItem}>Insert</Button>
		</div>
	</div>
</Card>
