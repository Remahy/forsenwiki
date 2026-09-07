import { createZoomImageWheel } from '@zoom-image/core';

/**
 * @param {HTMLElement} rootElement
 */
export const initializeZoomForImgElements = (rootElement) => {
	/**
	 * @type {Function[]}
	 */
	const cleanups = [];

	const elements = rootElement.querySelectorAll('img.image');

	for (let index = 0; index < elements.length; index++) {
		const element = elements[index];

		if (!(element instanceof HTMLImageElement)) {
			continue;
		}

		if (
			element.getAttribute('width') !== 'inherit' ||
			element.getAttribute('height') !== 'inherit'
		) {
			continue;
		}

		if (element.parentElement?.classList.contains('embla-thumbs__slide')) {
			continue;
		}

		const parentContainer = element.parentElement;

		if (!parentContainer) {
			continue;
		}

		if (parentContainer.classList.contains('embla__slide')) {
			const { cleanup } = createZoomImageWheel(parentContainer, {
				zoomTarget: element,
			});

			cleanups.push(cleanup);
			continue;
		}

		const container = document.createElement('div');
		container.classList.add('inline-block', 'relative', 'overflow-visible!');
		const clonedImg = element.cloneNode();
		container.append(clonedImg);
		element.replaceWith(container);

		const { cleanup } = createZoomImageWheel(container);


		cleanups.push(cleanup);
	}

	return () => {
		cleanups.forEach((fn) => fn());
	};
};
