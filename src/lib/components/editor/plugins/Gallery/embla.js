import EmblaCarousel from 'embla-carousel';
import { mount, unmount } from 'svelte';
import { PlayIcon } from '@lucide/svelte';

/**
 * @typedef {typeof EmblaCarousel} Embla
 */

/**
 * @param {HTMLElement} element
 */
export const initializeEmblaForEditorElement = (element) => {
	const embla = EmblaCarousel(element, {
		loop: false,
		watchDrag: false,
	});

	return embla;
};

/**
 * @param {HTMLElement} element
 */
const initializeEmblaForElement = (element) => {
	const embla = EmblaCarousel(element, {
		loop: false,
		watchDrag: false,
	});

	return embla;
};

/**
 * @param {HTMLElement} element
 */
const initializeEmblaThumbnailForElement = (element) => {
	const embla = EmblaCarousel(element, {
		loop: false,
		containScroll: 'keepSnaps',
		dragFree: true,
	});

	return embla;
};

/**
 * @param {import('embla-carousel').EmblaCarouselType} emblaApiMain
 * @param {import('embla-carousel').EmblaCarouselType} emblaApiThumb
 */
const addThumbButtonClickHandlers = (emblaApiMain, emblaApiThumb) => {
	/**
	 * @type {Function[]}
	 */
	const cleanups = [];

	const slidesThumbs = emblaApiThumb.slideNodes();

	const scrollToIndex = slidesThumbs.map((_, index) => () => emblaApiMain.scrollTo(index));

	slidesThumbs.forEach((slideNode, index) => {
		slideNode.addEventListener('click', scrollToIndex[index], false);
		cleanups.push(() => slideNode.removeEventListener('click', scrollToIndex[index]));
	});

	return () => {
		cleanups.forEach((fn) => fn());
	};
};

/**
 * @param {import('embla-carousel').EmblaCarouselType} emblaApiMain
 * @param {import('embla-carousel').EmblaCarouselType} emblaApiThumb
 */
const addToggleThumbButtonsActive = (emblaApiMain, emblaApiThumb) => {
	const slidesThumbs = emblaApiThumb.slideNodes();

	const toggleThumbBtnsState = () => {
		emblaApiThumb.scrollTo(emblaApiMain.selectedScrollSnap());
		const previous = emblaApiMain.previousScrollSnap();
		const selected = emblaApiMain.selectedScrollSnap();

		const previousNode = emblaApiMain.slideNodes()[previous];

		if (previousNode) {
			const [item] = [...previousNode.querySelectorAll('video, iframe')];

			if (item instanceof HTMLIFrameElement && item.contentWindow) {
				item.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
			}

			if (item instanceof HTMLVideoElement) {
				item.pause();
			}
		}

		slidesThumbs[previous].classList.remove('embla-thumbs__slide--selected');
		slidesThumbs[selected].classList.add('embla-thumbs__slide--selected');
	};

	emblaApiMain.on('select', toggleThumbBtnsState);
	toggleThumbBtnsState();
};

/**
 * @param {HTMLElement} thumbnailViewport
 */
const addVideoIcons = (thumbnailViewport) => {
	const videoThumbnails = thumbnailViewport.querySelectorAll(
		'[data-lexical-youtube], [data-lexical-twitch], video'
	);

	const cleanups = [...videoThumbnails].map((thumbnail) => {
		const target = document.createElement('span');
		target.classList.add('embla-thumbs__video-icon');
		thumbnail.after(target);

		const icon = mount(PlayIcon, { target, props: { size: 18, fill: 'currentColor' } });

		return () => {
			unmount(icon);
			target.remove();
		};
	});

	return () => cleanups.forEach((fn) => fn());
};

export const GALLERY_FULLSCREEN_CHANGE = 'gallery-fullscreen-change';

/**
 * @param {HTMLElement} element
 * @param {boolean} isFullscreen
 */
const setFullscreen = (element, isFullscreen) => {
	if (element.classList.contains('embla-fullscreen') === isFullscreen) {
		return;
	}

	element.classList.toggle('embla-fullscreen', isFullscreen);
	element.dispatchEvent(new Event(GALLERY_FULLSCREEN_CHANGE));
};

/**
 * @param {HTMLElement} rootElement
 */
export const initializeEmblaForArticle = (rootElement) => {
	const elements = rootElement.querySelectorAll('.gallery');

	/**
	 * @type {Function[]}
	 */
	const cleanups = [];

	for (let index = 0; index < elements.length; index++) {
		/**
		 * @type {HTMLElement}
		 */
		const element = /** @type {any} */ (elements[index]);

		/**
		 * @type {HTMLElement}
		 */
		const viewportElement = /** @type {any} */ (element.querySelector('.embla__viewport'));

		const emblaApiMain = initializeEmblaForElement(viewportElement);

		const thumbnailElements = element.querySelectorAll('.embla-thumbs__viewport');

		for (let index = 0; index < thumbnailElements.length; index++) {
			/**
			 * @type {HTMLElement}
			 */
			const element = /** @type {any} */ (thumbnailElements[index]);

			const emblaApiThumbnail = initializeEmblaThumbnailForElement(element);

			cleanups.push(addVideoIcons(element));
			cleanups.push(addThumbButtonClickHandlers(emblaApiMain, emblaApiThumbnail));
			addToggleThumbButtonsActive(emblaApiMain, emblaApiThumbnail);

			cleanups.push(() => emblaApiThumbnail.destroy());
		}

		cleanups.push(() => emblaApiMain.destroy());

		const fullscreenButton = element.querySelector('button.embla-fullscreen-button');

		const toggleFn = () =>
			setFullscreen(element, !element.classList.contains('embla-fullscreen'));

		/** @param {KeyboardEvent} event */
		const onKeyDown = (event) => {
			if (event.key === 'Escape' && element.classList.contains('embla-fullscreen')) {
				event.preventDefault();
				setFullscreen(element, false);
			}
		};

		fullscreenButton?.addEventListener('click', toggleFn);
		document.addEventListener('keydown', onKeyDown);
		cleanups.push(() => {
			fullscreenButton?.removeEventListener('click', toggleFn);
			document.removeEventListener('keydown', onKeyDown);
			setFullscreen(element, false);
		});
	}

	return () => {
		cleanups.forEach((fn) => fn());
	};
};
