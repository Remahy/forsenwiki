<script>
	import { ChevronDownIcon, ChevronRightIcon } from '@lucide/svelte';

	/**
	 * @type {{ title: import('svelte').Snippet, content: import('svelte').Snippet }}
	 */
	let { title, content } = $props();

	let isOpen = $state(true);
</script>

<details class="flex w-full flex-col justify-items-stretch" bind:open={isOpen}>
	<summary class="list-none marker:hidden">
		<div class="button-bg flex items-center gap-2 pl-2 hover:cursor-pointer">
			{#if isOpen}
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
