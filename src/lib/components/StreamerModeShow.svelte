<script>
	import { page } from '$app/stores';
	import Button from './Button.svelte';

	let streamerMode = $state($page.data.session?.user?.userSettings?.streamerMode);
	let show = $state(false);

	let { children } = $props();
</script>

{#if !streamerMode || show}
	{@render children?.()}
{:else}
	<Button
		onclick={() => (show = true)}
		class="inline-block min-h-[unset]! bg-transparent! p-0! underline text-inherit!"
	>
		Hidden
	</Button>
{/if}
