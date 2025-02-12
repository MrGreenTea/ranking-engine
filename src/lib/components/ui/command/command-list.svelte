<script lang="ts">
	import { Command as CommandPrimitive } from 'bits-ui';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: CommandPrimitive.ListProps = $props();
</script>

<CommandPrimitive.List
	class={['max-h-[300px] overflow-y-auto overflow-x-hidden', className]}
	{...restProps}
	bind:ref
/>
