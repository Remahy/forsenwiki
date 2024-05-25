<script>
	import { getContext, onMount } from 'svelte';

	/** @type {ComposerWritable} */
	const c = getContext('COMPOSER');

	onMount(() => {
		c.subscribe((composer) => {
			if (!composer) {
				return;
			}

			const editor = composer.getEditor();

			/** @type {HTMLDivElement | null}*/
			const el = document.querySelector('.editor-shell');

			if (el) {
				setTimeout(() => {
					editor.getRootElement()?.focus()
				}, 0);
			}
		})
	});
</script>
