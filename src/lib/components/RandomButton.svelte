<script>
	import { page } from '$app/stores';
	import { Dice4Icon } from 'lucide-svelte';

	import LinkButton from '$lib/components/LinkButton.svelte';
	import Spinner from '$lib/components/Spinner.svelte';

	let randomIsSpinning = $derived(false);

	const hasRandomParameter = $page.url.searchParams.has('random');
</script>

{#if hasRandomParameter}
	<LinkButton
		href="/random"
		reload
		class="flex gap-2 whitespace-nowrap{randomIsSpinning ? ' pointer-events-none opacity-50' : ''}"
		on:click={() => (randomIsSpinning = true)}
	>
		<Dice4Icon /> <span>Random</span>
		{#if randomIsSpinning}
			<Spinner />
		{/if}
	</LinkButton>
{/if}
