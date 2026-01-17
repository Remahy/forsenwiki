<script>
	import Spinner from '$lib/components/Spinner.svelte';
	import { Trash2Icon } from 'lucide-svelte';

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
		isLoading = $bindable(false),
		children,
	} = $props();

	const onClickResetWrapper = () => {
		isLoading = true;

		setTimeout(() => {
			const ok = confirm('Are you sure? This will delete your local draft edit.');

			if (ok) {
				onClickReset();
			}

			isLoading = false;
		});
	};
</script>

<button
	{disabled}
	class="flex items-center cursor-pointer gap-1 !font-bold text-sm text-red-600 underline text-start"
	title="Reset"
	onclick={onClickResetWrapper}
>
	{#if isLoading}
		<Spinner size={16} />
	{:else}
		<Trash2Icon size={16} />
	{/if}

	{@render children?.()}
</button>
