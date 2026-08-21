<script>
	import { ChevronDownIcon, ChevronRightIcon } from '@lucide/svelte';

	/**
	 * @type {{ title: import('svelte').Snippet, content: import('svelte').Snippet }}
	 */
	const { title, content } = $props();

	let open = $state(true);
</script>

<details class="flex w-full flex-col justify-items-stretch" bind:open>
	<summary class="list-none marker:hidden">
		<div class="button-bg flex items-center gap-2 pl-2 hover:cursor-pointer">
			{#if open}
				<ChevronDownIcon />
			{:else}
				<ChevronRightIcon />
			{/if}
			<div class="grow">
				{@render title()}
			</div>
		</div>
	</summary>

	{@render content()}
</details>
