<script>
	import { onMount } from 'svelte';
	import { MaximizeIcon } from '@lucide/svelte';
	import { modal } from '$lib/stores/modal';
	import { STATIC_DOMAIN } from '$lib/environment/environment';
	import { getContentByHash } from '$lib/api/content';
	import { initializeZoomWithDefaults } from '../editor/plugins/Gallery/zoom';
	import Link from '../Link.svelte';

	/** @type {{ src: string, name: string, contentId?: string, onclose?: () => void }} */
	const { src, name, contentId, onclose } = $props();

	let hash = $derived(src.startsWith(STATIC_DOMAIN) ? src.split('/').pop() : undefined);
	let rawSrc = $derived(hash ? `${STATIC_DOMAIN}/${hash}` : src);

	let fetchedContent = $state(/** @type {{ id: string, name: string } | null} */ (null));

	// A lookup isn't necessary if the component is provided the details.
	$effect(() => {
		if (contentId || !hash) {
			return;
		}

		let isCurrent = true;

		getContentByHash(hash)
			.then((res) => (res.ok ? res.json() : null))
			.then((result) => {
				if (isCurrent) {
					fetchedContent = result;
				}
			})
			.catch((err) => {
				console.error('Failed loading image content', err);
			});

		return () => {
			isCurrent = false;
		};
	});

	let content = $derived(contentId ? { id: contentId, name } : fetchedContent);
	let displayName = $derived(content?.name || name);

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
	aria-label={displayName}
	class="modal-color pointer-events-auto fixed inset-0 z-50 flex h-dvh flex-col"
>
	<div bind:this={container} class="min-h-0 grow overflow-hidden">
		<img src={rawSrc} alt={name} class="m-0! h-full w-full object-contain" />
	</div>
	{#if displayName}
		<div class="modal-color absolute bottom-2 left-2 max-w-[calc(100%-5rem)] truncate px-2 py-1">
			{#if content}
				<Link href="/content/{content.id}" target="_blank" title="Open content page">
					{displayName}
				</Link>
			{:else}
				<span>{displayName}</span>
			{/if}
		</div>
	{/if}
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
