<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';

	export let item: string;
	export let highlighted = false;
	export let onSelect: () => void;
	export let onHighlight: () => void;
	export let onUnhighlight: () => void;
</script>

<Button
	onclick={onSelect}
	class={cn('h-32 text-lg', highlighted ? 'bg-muted' : '')}
	onmouseenter={onHighlight}
	onmouseleave={onUnhighlight}
>
	{item}
</Button>
