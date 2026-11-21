<script>
	import { onMount } from 'svelte';
	import { MaximizeIcon } from '@lucide/svelte';
	import { modal } from '$lib/stores/modal';
	import { STATIC_DOMAIN } from '$lib/environment/environment';
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

	const close = () => {
		if (onclose) {
			onclose();
			return;
		}

		$modal.isOpen = false;
	};

	/** @param {KeyboardEvent} event */
	const onKeyDown = (event) => {
		if (event.key === 'Escape') {
			event.preventDefault();
			close();
		}
	};

	onMount(() => {
		const previousFocus = document.activeElement;

		closeButton.focus();

		const { cleanup } = initializeZoomWithDefaults(container);

		return () => {
			cleanup();

			if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
				previousFocus.focus({ preventScroll: true });
			}
		};
	});
</script>

<svelte:window onkeydown={onKeyDown} />

<div
	role="dialog"
	aria-modal="true"
	aria-label={name}
	class="modal-color pointer-events-auto fixed inset-0 z-50 flex h-dvh flex-col"
>
	<div bind:this={container} class="min-h-0 grow overflow-hidden">
		<img src={rawSrc} alt={name} class="m-0! h-full w-full object-contain" />
	</div>
	<button
		bind:this={closeButton}
		type="button"
		class="embla-fullscreen-button button absolute! right-2 bottom-2 m-0! p-1!"
		aria-label="Close image"
		onclick={close}
	>
		<MaximizeIcon />
	</button>
</div>
