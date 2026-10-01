import { createZoomImageWheel } from '@zoom-image/core';
import { get } from 'svelte/store';
import { flushSync } from 'svelte';
import { modal } from '$lib/stores/modal';
import ImageFocus from '$lib/components/content/ImageFocus.svelte';

/**
 * @param {HTMLElement} rootElement
 */
export const initializeZoomForImgElements = (rootElement) => {
	/**
	 * @type {Function[]}
	 */
	const cleanups = [];
	let openedImage = false;

	const elements = rootElement.querySelectorAll('img.image');

	for (let index = 0; index < elements.length; index++) {
		const element = elements[index];

		if (!(element instanceof HTMLImageElement)) {
			continue;
		}

		if (element.closest('.embla-thumbs__slide, a')) {
			continue;
		}

		const openImage = () => {
			if (document.fullscreenElement) {
				return;
			}

			openedImage = true;
			// Mount during the user gesture so the browser allows requesting fullscreen.
			flushSync(() => {
				modal.set({
					component: ImageFocus,
					isOpen: true,
					src: element.currentSrc || element.src,
					name: element.alt,
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

		const previousRole = element.getAttribute('role');
		const previousTabIndex = element.getAttribute('tabindex');
		element.setAttribute('role', 'button');
		element.setAttribute('tabindex', '0');
		element.classList.add('cursor-zoom-in');
		element.addEventListener('click', openImage);
		element.addEventListener('keydown', onKeyDown);

		cleanups.push(() => {
			element.removeEventListener('click', openImage);
			element.removeEventListener('keydown', onKeyDown);
			element.classList.remove('cursor-zoom-in');
			if (previousRole === null) {
				element.removeAttribute('role');
			} else {
				element.setAttribute('role', previousRole);
			}
			if (previousTabIndex === null) {
				element.removeAttribute('tabindex');
			} else {
				element.setAttribute('tabindex', previousTabIndex);
			}
		});

		const parentContainer = element.parentElement;

		if (!parentContainer) {
			continue;
		}

		if (parentContainer.classList.contains('embla__slide')) {
			const { cleanup, setState } = createZoomImageWheel(parentContainer, {
				zoomTarget: element,
				initialState: { enable: false },
			});

			const onFullscreenChange = () => {
				setState({ currentZoom: 1 });
				setState({
					enable: !!document.fullscreenElement?.contains(element),
				});
			};

			document.addEventListener('fullscreenchange', onFullscreenChange);
			cleanups.push(cleanup);
			cleanups.push(() => document.removeEventListener('fullscreenchange', onFullscreenChange));
		}
	}

	return () => {
		cleanups.forEach((fn) => fn());
		const currentModal = get(modal);
		if (openedImage && currentModal?.component === ImageFocus && currentModal.isOpen) {
			modal.set({ ...currentModal, isOpen: false });
		}
	};
};
