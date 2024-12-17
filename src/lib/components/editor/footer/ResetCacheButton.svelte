<script>
	import Button from '$lib/components/Button.svelte';
	import Spinner from '$lib/components/Spinner.svelte';

	export let disabled = false;
	export let onClickReset = () => {};
	export let isLoading = false;
</script>

<Button
	{disabled}
	class="bg-error-color flex-col !font-bold hover:!bg-opacity-70"
	title="Reset"
	on:click={onClickReset}
>
	{#if isLoading}
		<Spinner />
	{/if}

	<slot />
</Button>
