<script>
	import Box from '../Box.svelte';
	import Button from '../Button.svelte';

	/** @type {{ onAccept?: () => void }} */
	let { onAccept } = $props();
</script>

<Box
	class="flex min-h-96 grow flex-col items-center justify-center gap-4 p-12 text-center"
	role="alertdialog"
	aria-label="NSFW content warning"
>
	<h2 class="m-0 text-2xl font-bold">NSFW</h2>

	<p class="m-0 max-w-md">
		This page may contain content that is not suitable to read or display on stream. Proceed at your
		own risk. <small class="text-xs">monkaE</small>
	</p>

	{#if onAccept}
		<Button onclick={onAccept}>I understand the consequences, show anyway</Button>
	{/if}
</Box>
