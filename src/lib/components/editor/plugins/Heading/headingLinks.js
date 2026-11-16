import { mount, unmount } from 'svelte';
import { LinkIcon } from '@lucide/svelte';
import { getHeadings } from '$lib/components/ToC/getHeadings';

/**
 * @param {HTMLElement} rootElement
 */
export const addHeadingLinks = (rootElement) => {
	const headings = getHeadings(rootElement).filter((heading) => heading.id);

	const cleanups = headings.map((heading) => {
		const link = document.createElement('a');
		link.href = `#${heading.id}`;
		link.classList.add('heading-link');
		link.setAttribute('aria-label', `Link to section: ${heading.textContent}`);
		heading.append(link);

		const icon = mount(LinkIcon, { target: link, props: { size: '0.6em' } });

		return () => {
			unmount(icon);
			link.remove();
		};
	});

	return () => cleanups.forEach((fn) => fn());
};
