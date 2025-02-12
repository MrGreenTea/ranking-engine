<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { estimateMergeSortComparisons } from '$lib/sorting';
	import { estimateTopKComparisons } from '$lib/top-k-selection';
	import { applicationStore, localStore } from '$lib/utils/storage.svelte';
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';

	import ComparePhase from './components/ComparePhase.svelte';
	import CreatePhase from './components/CreatePhase.svelte';
	import InsertionPhase from './components/InsertionPhase.svelte';
	import ResultPhase from './components/ResultPhase.svelte';

	type Phase = 'compare' | 'create' | 'insertion' | 'result';

	const defaultList = 'my first list';
	let lists = applicationStore<string[]>('lists', [defaultList]);
	let selectedList = applicationStore<string>('selected-list', lists.value[0]);

	let items = localStore<string[]>(selectedList.value, 'ranking-items', []);
	let sortedItems = localStore<string[]>(selectedList.value, 'ranking-sorted-items', []);
	let remainingItems = localStore<string[]>(selectedList.value, 'ranking-remaining-items', []);

	let topK = localStore<null | number>(selectedList.value, 'ranking-top-k', null);
	let comparisonsCount = localStore<number>(selectedList.value, 'ranking-comparisons-count', 0);
	let newItem = $state<null | string>(null);

	let phase = $state<Phase>('create');

	onMount(() => {
		// If we have sorted items, go to result phase
		if (sortedItems.value.length > 0) {
			phase = 'result';
		}
		// If we have items and comparison cache, go to compare phase
		else if (items.value.length > 0 && comparisonsCount.value > 0) {
			phase = 'compare';
		}
	});

	const estimatedComparisons = $derived.by(() => {
		if (topK.value !== null) {
			return estimateTopKComparisons(items.value.length, topK.value);
		} else {
			return estimateMergeSortComparisons(items.value.length);
		}
	});

	const [send, receive] = crossfade({
		duration: 200,
		easing: cubicOut
	});

	let showCreateList = $state(false);
	let newListName = $state('');
	let newListError = $state('');

	function checkNewListName() {
		if (!newListName) {
			newListError = 'Please enter a list name';
			return false;
		}
		if (lists.value.includes(newListName)) {
			newListError = 'This list already exists';
			return false;
		}
		newListError = '';
		return true;
	}

	function createList() {
		if (!checkNewListName()) return;

		lists.value = [...lists.value, newListName];
		selectedList.value = newListName;

		// close dialog
		showCreateList = false;
	}

	function deleteList(list: string) {
		// disallow deleting the only list
		if (lists.value.length < 2) return;

		// Remove the list from lists
		const currentIndex = lists.value.indexOf(list);
		lists.value = lists.value.filter((l) => l !== list);

		// If the deleted list was selected, switch to the one that was after it
		if (selectedList.value === list) {
			if (currentIndex < lists.value.length) {
				selectedList.value = lists.value[currentIndex];
			} else {
				// when we deleted the last list, choose the new last one.
				selectedList.value = lists.value[lists.value.length - 1];
			}
		}

		// Clear all local storage keys for this list
		if (typeof window !== 'undefined') {
			const keysToDelete = [
				`${list}:ranking-items`,
				`${list}:ranking-sorted-items`,
				`${list}:ranking-remaining-items`,
				`${list}:ranking-top-k`,
				`${list}:ranking-comparisons-count`
			];
			keysToDelete.forEach((key) => localStorage.removeItem(key));
		}
	}

	function clearAll() {
		phase = 'create';
		items.reset();
		sortedItems.reset();
		remainingItems.reset();
		comparisonsCount.reset();
		topK.reset();
	}
	async function startSorting() {
		if (items.value.length < 2) return;
		phase = 'compare';
	}

	function restart() {
		phase = 'create';
		comparisonsCount.reset();
		sortedItems.reset();
		remainingItems.reset();
	}
</script>

<main class="container mx-auto max-w-2xl p-4">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Ranking Engine</h1>
			<div class="mt-2 space-y-2">
				<div class="flex flex-wrap gap-2">
					{#each lists.value as list}
						<Button
							variant={selectedList.value === list ? 'default' : 'outline'}
							onclick={() => {
								selectedList.value = list;
							}}
							class="group relative"
						>
							{list}
							{#if lists.value.length > 1}
								<Dialog.Root>
									<Dialog.Trigger
										class="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600 group-hover:flex"
									>
										x
									</Dialog.Trigger>

									<Dialog.Content>
										<Dialog.Header>
											<Dialog.Title>Delete List</Dialog.Title>
										</Dialog.Header>
										<Dialog.Description>
											Are you sure you want to delete "{list}"? This action cannot be undone.
										</Dialog.Description>
										<Dialog.Footer>
											<div class="flex justify-end gap-2">
												<Dialog.Close variant="outline">Cancel</Dialog.Close>
												<Dialog.Close variant="destructive" onclick={() => deleteList(list)}>
													Delete
												</Dialog.Close>
											</div>
										</Dialog.Footer>
									</Dialog.Content>
								</Dialog.Root>
							{/if}
						</Button>
					{/each}
				</div>
			</div>
			<div class="mt-2">
				Try also
				<a href="/collaborative" class="text-blue-500 hover:underline">Collaborative Ranking</a>
				or
				<a href="/matrix" class="text-blue-500 hover:underline">Visualization</a>
			</div>
		</div>

		<div>
			<Dialog.Root
				bind:open={showCreateList}
				onOpenChange={() => {
					newListName = '';
					newListError = '';
				}}
			>
				<Dialog.Trigger>
					{#snippet child({ props })}
						<Button variant="outline" {...props}>New List</Button>
					{/snippet}
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>Create New List</Dialog.Title>
						<Dialog.Description>Enter a unique name for your new list.</Dialog.Description>
					</Dialog.Header>

					<form onsubmit={() => createList()}>
						<div class="grid gap-4 py-4">
							<div class="grid gap-2">
								<Label for="name">Name</Label>
								<Input id="name" bind:value={newListName} oninput={() => checkNewListName()} />
								{#if newListError}
									<p class="text-sm text-red-500">{newListError}</p>
								{/if}
							</div>
						</div>

						<Dialog.Footer>
							<Button disabled={newListError !== ''} type="submit" onclick={() => createList()}>
								Create
							</Button>
						</Dialog.Footer>
					</form>
				</Dialog.Content>
			</Dialog.Root>
			<Dialog.Root>
				<Dialog.Trigger>
					{#snippet child({ props })}
						<Button variant="destructive" {...props}>Clear All</Button>
					{/snippet}
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>Clear All</Dialog.Title>
						<Dialog.Description
							>This will remove all your items and rankings. This action cannot be undone.</Dialog.Description
						>
					</Dialog.Header>
					<Dialog.Footer>
						<Dialog.Close variant="outline">Cancel</Dialog.Close>
						<Dialog.Close variant="destructive" onclick={clearAll}>Continue</Dialog.Close>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
		</div>
	</div>

	<div class="space-y-8">
		<div class="phase-container relative min-h-[200px]">
			<!-- Phase 1: Create List -->
			{#if phase === 'create'}
				<div
					class="absolute block w-full"
					in:receive={{ key: 'phase' }}
					out:send={{ key: 'phase' }}
				>
					<CreatePhase onStartSorting={startSorting} {items} {topK} />
				</div>
			{:else if phase === 'compare'}
				<!-- Phase 2: Compare Items -->
				<div
					class="absolute inset-0 block w-full"
					in:receive={{ key: 'phase' }}
					out:send={{ key: 'phase' }}
				>
					<ComparePhase
						topK={topK.value}
						items={items.value}
						{comparisonsCount}
						{estimatedComparisons}
						onRestart={restart}
						onSortingFinished={(top, rest, comparisons) => {
							sortedItems.value = top;
							remainingItems.value = rest;
							comparisonsCount.value = comparisons;
							phase = 'result';
						}}
					/>
				</div>
			{:else if phase === 'insertion' && newItem !== null}
				<!-- Phase 3: Insertion Items -->
				<div
					class="absolute inset-0 block w-full"
					in:receive={{ key: 'phase' }}
					out:send={{ key: 'phase' }}
				>
					<InsertionPhase
						sortedItems={sortedItems.value}
						{newItem}
						onInsertionFinished={(result) => {
							sortedItems.value = result;
							newItem = null;
							phase = 'result';
						}}
					/>
				</div>
			{:else if phase === 'result'}
				<!-- Phase 4: Show Results -->
				<div
					class="absolute block w-full"
					in:receive={{ key: 'phase' }}
					out:send={{ key: 'phase' }}
				>
					<ResultPhase
						topK={topK.value}
						comparisonsCount={comparisonsCount.value}
						bind:sortedItems={sortedItems.value}
						remainingItems={remainingItems.value}
						onInsertNewItem={(i) => {
							phase = 'insertion';
							newItem = i;
						}}
						onRestart={restart}
					/>
				</div>
			{/if}
		</div>
	</div>
</main>
