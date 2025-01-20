<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import ComparisonButton from '$lib/components/comparison-button.svelte';

	let {
		currentComparison = $bindable(),
		choose = $bindable()
	}: {
		currentComparison: { item1: string; item2: string } | null;
		choose: (item: string) => void;
	} = $props();
</script>

<Card class="p-6">
	<h2 class="mb-4 text-xl font-semibold">Compare items</h2>
	<p class="mb-4 text-sm text-muted-foreground">Click on the item you prefer:</p>
	<div class="grid gap-4 sm:grid-cols-2" data-testid="comparison-buttons">
		<ComparisonButton
			item={currentComparison?.item1 ?? ''}
			onSelect={() => {
				if (currentComparison) choose(currentComparison.item1);
			}}
		/>
		<ComparisonButton
			item={currentComparison?.item2 ?? ''}
			onSelect={() => {
				if (currentComparison) choose(currentComparison.item2);
			}}
		/>
	</div>
</Card>
