<script>
	import { flushSync } from 'svelte';
	import { modal } from '$lib/stores/modal';
	import ImageFocus from '$lib/components/content/ImageFocus.svelte';

	const { src, name, className = '', fullscreen = false } = $props();

	const openImage = () => {
		if (document.fullscreenElement) {
			return;
		}

		// Mount during the user gesture so the browser allows requesting fullscreen.
		flushSync(() => {
			modal.set({
				component: ImageFocus,
				isOpen: true,
				src,
				name,
			});
		});
	};

	/** @param {KeyboardEvent} event */
	const onKeyDown = (event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			openImage();
		}
	};
</script>

{#if fullscreen}
	<img
		{src}
		alt={name}
		role="button"
		tabindex="0"
		class="mx-auto w-full max-w-full cursor-zoom-in {className}"
		onclick={openImage}
		onkeydown={onKeyDown}
	/>
{:else}
	<img {src} alt={name} class="mx-auto w-full max-w-full {className}" />
{/if}
