<script>
	import { onMount } from 'svelte';
	import { MaximizeIcon } from '@lucide/svelte';
	import { createZoomImageWheel } from '@zoom-image/core';
	import { modal } from '$lib/stores/modal';

	/** @type {{ src: string, name: string }} */
	const { src, name } = $props();

	/** @type {HTMLElement} */
	let container;
	/** @type {HTMLButtonElement} */
	let closeButton;
	/** @type {HTMLElement} */
	let viewer;

	const exitFullscreen = () => {
		if (document.fullscreenElement === viewer) {
			document.exitFullscreen().catch((err) => {
				console.error('Failed exiting image fullscreen', err);
			});
		}
	};

	const close = () => {
		$modal.isOpen = false;
	};

	onMount(() => {
		let isMounted = true;
		const previousFocus = document.activeElement;
		closeButton.focus();
		const { cleanup } = createZoomImageWheel(container);

		const onFullscreenChange = () => {
			if (document.fullscreenElement !== viewer) {
				close();
			}
		};

		document.addEventListener('fullscreenchange', onFullscreenChange);
		viewer
			.requestFullscreen?.()
			.then(() => {
				if (!isMounted) {
					exitFullscreen();
				}
			})
			.catch((err) => {
				console.error('Failed opening image fullscreen', err);
			});

		return () => {
			isMounted = false;
			document.removeEventListener('fullscreenchange', onFullscreenChange);
			exitFullscreen();
			cleanup();
			if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
				previousFocus.focus({ preventScroll: true });
			}
		};
	});
</script>

<div bind:this={viewer} class="modal-color pointer-events-auto fixed inset-0 flex h-dvh flex-col">
	<div bind:this={container} class="min-h-0 grow overflow-hidden">
		<img {src} alt={name} class="m-0! h-full w-full object-contain" />
	</div>
	<button
		bind:this={closeButton}
		type="button"
		class="embla-fullscreen-button button absolute right-2 bottom-2 m-0! p-1!"
		aria-label="Close image"
		onclick={close}
	>
		<MaximizeIcon />
	</button>
</div>
