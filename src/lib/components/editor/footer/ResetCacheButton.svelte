<script>
	import Button from '$lib/components/Button.svelte';
	import Spinner from '$lib/components/Spinner.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {boolean} [disabled]
	 * @property {any} [onClickReset]
	 * @property {boolean} [isLoading]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let {
		disabled = false,
		onClickReset = () => {},
		isLoading = false,
		children
	} = $props();
</script>

<Button
	{disabled}
	class="bg-error-color flex-col !font-bold"
	title="Reset"
	on:click={onClickReset}
>
	{#if isLoading}
		<Spinner />
	{/if}

	{@render children?.()}
</Button>
