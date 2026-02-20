<script>
	import {
		COMMAND_PRIORITY_CRITICAL,
		SELECTION_CHANGE_COMMAND,
		$getSelection as getSelection,
	} from 'lexical';
	import { getContext, onMount } from 'svelte';

	import Divider from '$lib/components/Divider.svelte';
	import { isDefined } from '$lib/utils/index';

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');

	/**
	 * @type {string | null}
	 */
	let keys = $state('');

	/**
	 * @type {string | null}
	 */
	let types = $state('');

	const update = () => {
		const selection = getSelection();

		if (selection) {
			const nodes = selection.getNodes();
			const nonTextNodes = nodes
				.map((node) => (node.getType() === 'text' ? node.getParent() : node))
				.filter(isDefined);
			const uniqueNodes = nonTextNodes.filter((n, index, arr) => arr.indexOf(n) === index);

			keys = uniqueNodes.length <= 5 ? uniqueNodes.map((node) => node.getKey()).join(', ') : 'Many';
			types =
				uniqueNodes.length <= 5 ? uniqueNodes.map((node) => node.getType()).join(', ') : 'Many';
			return;
		}

		keys = null;
		types = null;
	};

	onMount(() => {
		c.subscribe((composer) => {
			if (composer === null) {
				return;
			}

			const editor = composer.getEditor();

			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					update();
					return false;
				},
				COMMAND_PRIORITY_CRITICAL
			);
		});
	});
</script>

<div class="flex items-center leading-none uppercase">
	<div class="flex items-center gap-1">
		{#if keys}
			<small><span class="font-bold">Key:</span> {keys}</small>
			<Divider />
		{/if}

		{#if types}
			<small><span class="font-bold">Type:</span> {types}</small>
		{/if}
	</div>
</div>
