<script>
	import { onMount } from 'svelte';
	import { NormalizeTripleClickSelectionExtension } from '@lexical/extension';
	import { getEditor } from 'svelte-lexical';

	/** @type {import('lexical').LexicalEditor} */
	const editor = getEditor();

	// Since Lexical 0.45 this is only included with RichTextExtension, but svelte-lexical's
	// RichTextPlugin uses registerRichText, so triple clicks would select into the next block.
	onMount(() => {
		/** @type {any} */
		const { build, config, register } = NormalizeTripleClickSelectionExtension;
		const output = build(editor, config);

		return register(editor, config, { getOutput: () => output });
	});
</script>
