<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	class={['flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className]}
	{...restProps}
>
	{@render children?.()}
</div>
