const ALIGNMENT = Object.freeze({
	LEFT: 'left',
	CENTER: 'center',
	RIGHT: 'right',
	JUSTIFY: 'justify',
});

const TYPES = Object.freeze({
	paragraph: 'Paragraph',
	quote: 'Quote',
	h1: 'Heading 1',
	h2: 'Heading 2',
	h3: 'Heading 3',
	h4: 'Heading 4',
	h5: 'Heading 5',
	bullet: 'Bulleted List',
	number: 'Numbered List',
});

export const ELEMENT_CONSTANTS = {
	ALIGNMENT,
	TYPES,
};
