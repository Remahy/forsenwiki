/**
 * @param {Element?} article
 */
export const getHeadings = (article) => {
	if (!article) {
		return [];
	}

	const headings = [...(article?.querySelectorAll?.('h1, h2, h3, h4, h5') || [])].filter(
		(element) => {
			return (
				element.parentElement instanceof HTMLElement && element.parentElement.tagName === 'MAIN'
			);
		}
	);

	if (!headings?.length) {
		return [];
	}

	return headings;
};
