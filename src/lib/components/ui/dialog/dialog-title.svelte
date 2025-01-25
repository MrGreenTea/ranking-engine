<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: DialogPrimitive.TitleProps = $props();
</script>

<DialogPrimitive.Title
	bind:ref
	class={['text-lg font-semibold leading-none tracking-tight', className]}
	{...restProps}
/>
