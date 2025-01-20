<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	export let item: string;
	export let onSelect: () => void;
</script>

<Button onclick={onSelect} class="h-32 text-lg">
	{item}
</Button>
