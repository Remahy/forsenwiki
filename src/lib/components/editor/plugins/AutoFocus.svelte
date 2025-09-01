<script>
  // Based on umaranis' svelte-lexical
	import { $setSelection as setSelection, $getRoot as getRoot } from 'lexical';
	import { getContext } from 'svelte';

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');

	$effect(() => {
		c.subscribe((composer) => {
			if (!composer) {
				return;
			}

			const editor = composer.getEditor();

			/** @type {HTMLDivElement | null}*/
			const el = document.querySelector('.editor-shell');

			if (el) {
				setTimeout(() => {
					editor.update(() => {
						const selection = getRoot().getLastChild()?.selectEnd();
						if (selection) {
							setSelection(selection);
						}
					});
				}, 100);
			}
		});
	});
</script>
