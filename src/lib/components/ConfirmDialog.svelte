<!--
  @component
  A reusable confirmation dialog component that asks for user confirmation before executing an action.
  Uses shadcn-svelte dialog component.
-->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';

	export let open = false;
	export let title = 'Are you sure?';
	export let description = 'This action cannot be undone.';
	export let onConfirm: () => void;
	export let confirmText = 'Continue';
	export let cancelText = 'Cancel';

	function handleConfirm() {
		onConfirm();
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>{title}</Dialog.Title>
			<Dialog.Description>{description}</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (open = false)}>{cancelText}</Button>
			<Button variant="destructive" onclick={handleConfirm}>{confirmText}</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
