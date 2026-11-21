<script>
	import { ScanSearchIcon } from '@lucide/svelte';
	import Button from '$lib/components/Button.svelte';
	import { revealBlock } from './utils/revealBlock';

	/**
	 * @typedef {Object} Props
	 * @property {LexicalEditor} editor
	 * @property {ErrorBlock[]} blocks
	 */

	/** @type {Props} */
	const { editor, blocks } = $props();

	let shown = $state(-1);

	const next = $derived((shown + 1) % blocks.length);

	const showNext = () => {
		shown = next;
		revealBlock(editor, blocks[shown].id);
	};
</script>

<Button class="shrink-0" on:click={showNext}>
	<ScanSearchIcon />
	{#if blocks.length > 1}
		Show {blocks[next].label} {next + 1} of {blocks.length}
	{:else}
		Show {blocks[0].label}
	{/if}
</Button>
