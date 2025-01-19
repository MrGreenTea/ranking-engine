<script lang="ts">
	import { crossfade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	export let show = true;
	export let key: string | number = '';

	const [send, receive] = crossfade({
		duration: 250,
		easing: cubicOut
	});
</script>

{#if show}
	<div class="transition-content" in:receive={{ key }} out:send={{ key }}>
		<slot />
	</div>
{/if}

<style>
	.transition-content {
		display: block;
		width: 100%;
	}
</style>
