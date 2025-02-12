<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';

	import { Button, type ButtonProps } from '../button';

	let {
		child,
		children,
		ref = $bindable(null),
		...restProps
	}: ButtonProps & DialogPrimitive.CloseProps = $props();
</script>

{#snippet defaultChild({ props }: { props: ButtonProps })}
	<Button {...props} {children} />
{/snippet}

<DialogPrimitive.Close child={child ?? defaultChild} bind:ref {children} {...restProps} />
