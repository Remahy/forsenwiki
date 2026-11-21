<script>
	import { ScanSearchIcon } from '@lucide/svelte';
	import Button from '$lib/components/Button.svelte';
	import { revealBlock } from './utils/revealBlock';

	/**
	 * @typedef {Object} Props
	 * @property {LexicalEditor} editor
	 * @property {string[]} blockIds
	 * @property {string} label
	 */

	/** @type {Props} */
	const { editor, blockIds, label } = $props();

	let shown = $state(-1);

	const showNext = () => {
		shown = (shown + 1) % blockIds.length;
		revealBlock(editor, blockIds[shown]);
	};
</script>

<Button class="shrink-0" on:click={showNext}>
	<ScanSearchIcon />
	{#if blockIds.length > 1}
		Show {label} {((shown + 1) % blockIds.length) + 1} of {blockIds.length}
	{:else}
		Show {label}
	{/if}
</Button>
