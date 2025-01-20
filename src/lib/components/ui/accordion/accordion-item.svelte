<script lang="ts">
	import { Accordion as AccordionPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: AccordionPrimitive.ItemProps = $props();
</script>

<AccordionPrimitive.Item bind:ref class={['border-b', className]} {...restProps} />
