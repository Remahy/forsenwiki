<script>
	import { mount, onDestroy, unmount } from 'svelte';
	import ImageFocus from '$lib/components/content/ImageFocus.svelte';

	const { src, name, contentId = undefined, className = '' } = $props();

	/** @type {ReturnType<typeof mount> | null} */
	let focus = null;

	const close = () => {
		if (focus) {
			unmount(focus);
			focus = null;
		}
	};

	// Mounted on <body>: a preview can sit inside a container (e.g. the search masonry) that traps `position: fixed`.
	const open = () => {
		if (!focus) {
			focus = mount(ImageFocus, {
				target: document.body,
				props: { src, name, contentId, onclose: close },
			});
		}
	};

	onDestroy(close);
</script>

<button
	type="button"
	class="block w-full cursor-zoom-in"
	aria-label="Open image fullscreen"
	onclick={open}
>
	<img {src} alt={name} class="mx-auto w-full max-w-full {className}" />
</button>
