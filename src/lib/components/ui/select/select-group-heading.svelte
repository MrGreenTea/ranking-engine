<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: SelectPrimitive.GroupHeadingProps = $props();
</script>

<SelectPrimitive.GroupHeading
	bind:ref
	class={['py-1.5 pl-8 pr-2 text-sm font-semibold', className]}
	{...restProps}
/>
