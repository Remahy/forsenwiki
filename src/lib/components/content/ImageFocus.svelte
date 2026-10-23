<script>
	import { onMount } from 'svelte';
	import { MaximizeIcon } from '@lucide/svelte';
	import { modal } from '#lib/stores/modal.js';
	import { STATIC_DOMAIN } from '#lib/environment/environment.js';
	import { initializeZoomWithDefaults } from '../editor/plugins/Gallery/zoom';

	/** @type {{ src: string, name: string, onclose?: () => void }} */
	const { src, name, onclose } = $props();

	let rawSrc = $derived(
		src.startsWith(STATIC_DOMAIN) ? `${STATIC_DOMAIN}/${src.split('/').pop()}` : src
	);

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
		if (onclose) {
			onclose();
			return;
		}

		$modal.isOpen = false;
	};

	onMount(() => {
		let isMounted = true;

		const previousFocus = document.activeElement;

		closeButton.focus();

		const { cleanup } = initializeZoomWithDefaults(container);

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
		<img src={rawSrc} alt={name} class="m-0! h-full w-full object-contain" />
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
