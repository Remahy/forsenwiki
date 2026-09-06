import EmblaCarousel from 'embla-carousel';

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
	const slidesThumbs = emblaApiThumb.slideNodes();

	const scrollToIndex = slidesThumbs.map((_, index) => () => emblaApiMain.scrollTo(index));

	slidesThumbs.forEach((slideNode, index) => {
		slideNode.addEventListener('click', scrollToIndex[index], false);
	});
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
		slidesThumbs[previous].classList.remove('embla-thumbs__slide--selected');
		slidesThumbs[selected].classList.add('embla-thumbs__slide--selected');
	};

	emblaApiMain.on('select', toggleThumbBtnsState);
	toggleThumbBtnsState();
};

/**
 * @param {HTMLElement} element
 */
const toggleFullScreen = (element) => {
	if (!document.fullscreenElement) {
		element.requestFullscreen();
		document.body.classList.add('embla-fullscreen');
	} else if (document.exitFullscreen) {
		document.body.classList.remove('embla-fullscreen');
		document.exitFullscreen();
	}
};

/**
 * @param {HTMLElement} rootElement
 */
export const initializeEmblaForArticle = (rootElement) => {
	const elements = rootElement.querySelectorAll('.gallery');

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

			addThumbButtonClickHandlers(emblaApiMain, emblaApiThumbnail);
			addToggleThumbButtonsActive(emblaApiMain, emblaApiThumbnail);
		}

		const fullscreenButton = element.querySelector('button.embla-fullscreen-button');

		fullscreenButton?.addEventListener('click', () => toggleFullScreen(element));
	}
};
