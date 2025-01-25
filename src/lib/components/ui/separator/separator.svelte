<script lang="ts">
	import { Separator as SeparatorPrimitive } from 'bits-ui';

	let {
		class: className,
		orientation = 'horizontal',
		ref = $bindable(null),
		...restProps
	}: SeparatorPrimitive.RootProps = $props();
</script>

<SeparatorPrimitive.Root
	bind:ref
	class={[
		'shrink-0 bg-border',
		orientation === 'horizontal' ? 'h-[1px] w-full' : 'min-h-full w-[1px]',
		className
	]}
	{orientation}
	{...restProps}
/>
