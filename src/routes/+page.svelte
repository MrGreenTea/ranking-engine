<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Popover from '$lib/components/ui/popover';
	import { estimateMergeSortComparisons } from '$lib/sorting';
	import { estimateTopKComparisons } from '$lib/top-k-selection';
	import { applicationStore, localStore } from '$lib/utils/storage.svelte';
	import { Check, ChevronsUpDown, Plus, Trash } from 'lucide-svelte';
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

	// TODO: I don't like that we have to derive the store...
	// but without it the reactivity doesn't work
	// maybe separating into components would help?
	let items = $derived(localStore<string[]>(selectedList.value, 'ranking-items', []));
	let sortedItems = $derived(localStore<string[]>(selectedList.value, 'ranking-sorted-items', []));
	let remainingItems = $derived(
		localStore<string[]>(selectedList.value, 'ranking-remaining-items', [])
	);
	let topK = $derived(localStore<null | number>(selectedList.value, 'ranking-top-k', null));
	let comparisonsCount = $derived(
		localStore<number>(selectedList.value, 'ranking-comparisons-count', 0)
	);

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

	function createList(newListName: string) {
		if (lists.value.includes(newListName)) {
			return;
		}

		lists.value = [...lists.value, newListName];
		selectedList.value = newListName;
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

	let openListSelection = $state(false);
	let searchedList = $state('');
</script>

<main class="container mx-auto max-w-2xl p-4">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Ranking Engine</h1>
			<div class="mt-2 space-y-2">
				<Popover.Root bind:open={openListSelection}>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button
								variant="outline"
								class="w-64 justify-between"
								{...props}
								role="combobox"
								aria-expanded={openListSelection}
							>
								{selectedList.value}
								<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-64 p-0">
						<Command.Root>
							<Command.Input bind:value={searchedList} placeholder="Search..." />
							<Command.List>
								<Command.Group>
									{#each lists.value as list}
										<div class="group relative">
											<Command.Item
												value={list}
												onSelect={() => {
													selectedList.value = list;
													openListSelection = false;
												}}
											>
												<Check class={list !== selectedList.value ? 'text-transparent' : ''} />
												{list}
											</Command.Item>

											{#if lists.value.length > 1}
												<Dialog.Root>
													<Dialog.Trigger
														class="absolute right-2 top-1/2 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600 group-hover:flex"
													>
														<Trash class="size-3" />
													</Dialog.Trigger>

													<Dialog.Content>
														<Dialog.Header>
															<Dialog.Title>Delete List</Dialog.Title>
														</Dialog.Header>
														<Dialog.Description>
															Are you sure you want to delete "{list}"? This action cannot be
															undone.
														</Dialog.Description>
														<Dialog.Footer>
															<div class="flex justify-end gap-2">
																<Dialog.Close variant="outline">Cancel</Dialog.Close>
																<Dialog.Close
																	variant="destructive"
																	onclick={() => deleteList(list)}
																>
																	Delete
																</Dialog.Close>
															</div>
														</Dialog.Footer>
													</Dialog.Content>
												</Dialog.Root>
											{/if}
										</div>
									{/each}
								</Command.Group>
								<div class="flex w-full items-center justify-center px-2 py-3">
									{#if searchedList}
										<Button
											disabled={lists.value.includes(searchedList)}
											variant="outline"
											onclick={() => {
												createList(searchedList);
												openListSelection = false;
											}}
										>
											<Plus class="size-4" /> Create</Button
										>
									{:else}
										<Button variant="outline" disabled></Button>
									{/if}
								</div>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</div>
			<div class="mt-2">
				Try also
				<a href="/collaborative" class="text-blue-500 hover:underline">Collaborative Ranking</a>
				or
				<a href="/matrix" class="text-blue-500 hover:underline">Visualization</a>
			</div>
		</div>

		<div>
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
