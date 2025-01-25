<script lang="ts">
	import type { Separator as SeparatorPrimitive } from 'bits-ui';

	import { Separator } from '$lib/components/ui/separator/index.js';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: SeparatorPrimitive.RootProps = $props();
</script>

<Separator bind:ref class={['-mx-1 my-1 h-px bg-muted', className]} {...restProps} />
