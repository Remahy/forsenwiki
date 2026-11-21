import { get } from 'svelte/store';
import { createZoomImageWheel } from '@zoom-image/core';
import { modal } from '$lib/stores/modal';
import ImageFocus from '$lib/components/content/ImageFocus.svelte';
import { GALLERY_FULLSCREEN_CHANGE } from './embla';

/**
 * @param {HTMLElement} container
 * @param {import('@zoom-image/core').ZoomImageWheelOptions} [options]
 */
export const initializeZoomWithDefaults = (container, options = {}) => {
	const wheelZoomRatio = 0.35;
	return createZoomImageWheel(container, {
		wheelZoomRatio,
		...options,
	});
};

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

		const { parentElement } = element;

		const gallery = element.closest('.gallery');

		if (gallery && parentElement?.classList.contains('embla__slide')) {
			const { cleanup, setState } = initializeZoomWithDefaults(parentElement, {
				zoomTarget: element,
				initialState: { enable: false },
			});

			const onFullscreenChange = () => {
				setState({ currentZoom: 1 });
				setState({
					enable: gallery.classList.contains('embla-fullscreen'),
				});
			};

			gallery.addEventListener(GALLERY_FULLSCREEN_CHANGE, onFullscreenChange);
			cleanups.push(() => {
				cleanup();
				gallery.removeEventListener(GALLERY_FULLSCREEN_CHANGE, onFullscreenChange);
			});

			continue;
		}

		const openImage = () => {
			openedImage = true;
			modal.set({
				isOpen: true,
				component: ImageFocus,
				src: element.currentSrc || element.src,
				name: element.alt,
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
	}

	return () => {
		cleanups.forEach((fn) => fn());
		const currentModal = get(modal);
		if (openedImage && currentModal?.component === ImageFocus && currentModal.isOpen) {
			modal.set({ ...currentModal, isOpen: false });
		}
	};
};
