<script>
	import Button from './Button.svelte';

	const onClick = () => (window.location.search = 'cachebust');
</script>

<Button
	class="mt-2 min-h-[unset] min-w-[unset] !p-1 text-xs"
	title="Forces server to parse into HTML using latest document in the database. Has cooldown."
	on:click={onClick}>Cache bust HTML</Button
>
