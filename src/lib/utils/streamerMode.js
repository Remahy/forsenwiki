export const runStreamerMode = () => {
	/**
	 * @type {ResizeObserver[]}
	 */
	let observers = [];

	const streamerModeItems = /** @type {HTMLElement[]}*/ ([
		...document.querySelectorAll('.article-root img'),
		...document.querySelectorAll('.article-root [data-lexical-youtube]'),
		...document.querySelectorAll('.article-root [data-lexical-twitch]'),
		...document.querySelectorAll('.article-root video'),
	]);

	for (let index = 0; index < streamerModeItems.length; index++) {
		const item = streamerModeItems[index];

		const parent = item.parentElement;

		if (!parent) {
			continue;
		}

		parent.classList.add('relative');

		const overlay = document.createElement('div');
		overlay.innerHTML = 'Show';

		overlay.classList.add(
			'absolute',
			'flex',
			'cursor-pointer',
			'items-center',
			'justify-center',
			'text-white',
			'bg-black/50',
			'whitespace-nowrap',
			'z-10'
		);

		overlay.style.width = `${item.offsetWidth + 2}px`;
		overlay.style.height = `${item.offsetHeight + 2}px`;

		const positionOverlay = () => {
			overlay.style.left = `${item.offsetLeft + item.offsetWidth / 2}px`;
			overlay.style.top = `${item.offsetTop + item.offsetHeight / 2}px`;
			overlay.style.width = `${item.offsetWidth + 2}px`;
			overlay.style.height = `${item.offsetHeight + 2}px`;
			overlay.style.transform = 'translate(-50%, -50%)';
		};

		item.insertAdjacentElement('afterend', overlay);
		positionOverlay();

		const ro = new ResizeObserver(positionOverlay);
		ro.observe(parent);
		observers.push(ro);

		const reveal = () => {
			item.classList.add('streamer-mode-disable');
			overlay.removeEventListener('click', reveal);
			overlay.remove();
		};

		overlay.addEventListener('click', reveal);
	}

	return () => {
		observers.forEach((observer) => observer.disconnect());
	};
};
