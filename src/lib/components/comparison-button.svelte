<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	export let item: string;
	export let onSelect: () => void;
	export let onHighlight: () => void;
	export let onUnhighlight: () => void;
</script>

<Button
	onclick={onSelect}
	class="h-32 text-lg"
	onmouseenter={onHighlight}
	onmouseleave={onUnhighlight}
>
	{item}
</Button>
