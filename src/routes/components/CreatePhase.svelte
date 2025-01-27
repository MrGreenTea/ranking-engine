<script lang="ts">
	import type { LocalStore } from '$lib/utils/storage.svelte';

	import Button from '$lib/components/ui/button/button.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import { estimateMergeSortComparisons } from '$lib/sorting';
	import { estimateTopKComparisons } from '$lib/top-k-selection';
	import { Plus } from 'lucide-svelte';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';

	let {
		items,
		onStartSorting,
		topK
	}: {
		items: LocalStore<string[]>;
		onStartSorting: () => void;
		topK: LocalStore<null | number>;
	} = $props();

	let dialogOpen = $state(false);
	let newItem = $state('');
	let importText = $state('');
	let estimatedComparisons = $derived(
		topK.value !== null && topK.value > 0
			? estimateTopKComparisons(items.value.length, topK.value)
			: estimateMergeSortComparisons(items.value.length)
	);

	function removeItem(item: string) {
		items.value = items.value.filter((i) => i !== item);
	}

	function addItem() {
		const trimmedItem = newItem.trim();
		if (trimmedItem && !items.value.includes(trimmedItem)) {
			items.value = [...items.value, trimmedItem];
			newItem = '';
		}
	}

	function importItems() {
		const newItems = importText
			.split('\n')
			.map((item) => item.trim())
			.filter((item) => item.length > 0 && !items.value.includes(item));

		items.value = [...items.value, ...newItems];
		importText = '';
		dialogOpen = false;
	}
</script>

<Card class="p-6">
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-xl font-semibold">Items to Rank</h2>
		<div class="flex items-center gap-4">
			<Input
				type="number"
				min="1"
				placeholder="Top K items (optional)"
				bind:value={topK.value}
				class="w-48"
			/>
		</div>
	</div>

	<div class="mb-6 flex flex-col items-center justify-center gap-2">
		<Button disabled={items.value.length < 2} onclick={onStartSorting} class="w-48"
			>Start Sorting</Button
		>
		{#if items.value.length > 2}
			<div class="text-sm text-muted-foreground">
				{estimatedComparisons.min} - {estimatedComparisons.max} comparisons
			</div>
		{/if}
	</div>

	<div class="flex gap-2">
		<Input
			type="text"
			placeholder="Add an item..."
			bind:value={newItem}
			onkeydown={(e) => e.key === 'Enter' && addItem()}
			class="flex-1"
		/>
		<Button disabled={!newItem} onclick={addItem} aria-label="Add">
			<Plus class="h-4 w-4" />
		</Button>
		<Dialog bind:open={dialogOpen}>
			<DialogTrigger>
				<div
					class="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
				>
					Import
				</div>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Import Items</DialogTitle>
				</DialogHeader>
				<div class="space-y-4">
					<Textarea
						placeholder="Enter items, one per line"
						bind:value={importText}
						rows={10}
						onkeydown={(e) => {
							if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
								e.preventDefault();
								importItems();
							}
						}}
					/>
					<Button onclick={importItems} class="w-full">Import Items</Button>
				</div>
			</DialogContent>
		</Dialog>
	</div>

	{#if items.value.length > 0}
		<ul class="space-y-2 px-2 py-4">
			{#each items.value.slice().reverse() as item (item)}
				<li animate:flip={{ duration: 300 }} transition:fade={{ duration: 200 }}>
					<Card class="flex items-center justify-between gap-3 p-3">
						<p class="flex-1 text-sm">{item}</p>
						<Button
							onclick={() => removeItem(item)}
							variant="ghost"
							class="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
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
								><path d="M3 6h18" /><path
									d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6a2 2 0 0 1 2-2h2"
								/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg
							>
							<span class="sr-only">Remove {item}</span>
						</Button>
					</Card>
				</li>
			{/each}
		</ul>
	{/if}
</Card>
