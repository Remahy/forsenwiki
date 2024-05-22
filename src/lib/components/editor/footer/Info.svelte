<script>
	import {
		COMMAND_PRIORITY_CRITICAL,
		SELECTION_CHANGE_COMMAND,
		$getSelection as getSelection
	} from 'lexical';
	import { getContext, onMount } from 'svelte';

	import Divider from '$lib/components/Divider.svelte';
	import { isDefined } from '$lib/utils/index';

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');

	/**
	 * @type {string | null}
	 */
	let keys = '';

	/**
	 * @type {string | null}
	 */
	let types = '';

	const update = () => {
		/**
		 * @type { BaseSelection & { hasFormat?: (format: string) => boolean } | null }
		 */
		const selection = getSelection();

		if (selection) {
			const nodes = selection.getNodes();
			const nonTextNodes = nodes.map((node) => node.getType() === 'text' ? node.getParent() : node).filter(isDefined);
			keys = nonTextNodes.length <= 5 ? nonTextNodes.map((node) => node.getKey()).join(', ') : 'Many';
			types = nonTextNodes.length <= 5 ? nonTextNodes.map((node) => node.getType()).join(', ') : 'Many';
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
				(_payload) => {
					update();
					return false;
				},
				COMMAND_PRIORITY_CRITICAL
			);
		});
	});
</script>

<div class="flex items-center uppercase leading-none text-violet-400">
	<div class="flex items-center gap-1">
		{#if keys}
			<small><strong>Key:</strong> {keys}</small>
			<Divider />
		{/if}

		{#if types}
			<small><strong>Type:</strong> {types}</small>
		{/if}
	</div>
</div>
