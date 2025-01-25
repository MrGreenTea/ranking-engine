<script lang="ts">
	import { Select as SelectPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithoutChildrenOrChild<SelectPrimitive.ScrollDownButtonProps> = $props();
</script>

<SelectPrimitive.ScrollDownButton
	bind:ref
	class={['flex cursor-default items-center justify-center py-1', className]}
	{...restProps}
>
	<ChevronDown class="size-4" />
</SelectPrimitive.ScrollDownButton>
