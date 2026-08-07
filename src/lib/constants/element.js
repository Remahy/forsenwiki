const ALIGNMENT = Object.freeze({
	left: 'Left',
	center: 'Center',
	right: 'Right',
	justify: 'Justify',
});

const insertableTypeLabels = {
	paragraph: 'Paragraph',
	quote: 'Quote',
	h1: 'Heading 1',
	h2: 'Heading 2',
	h3: 'Heading 3',
	h4: 'Heading 4',
	h5: 'Heading 5',
	bullet: 'Bulleted list',
	number: 'Numbered list',
};

const TYPES = Object.freeze(insertableTypeLabels);

export const ELEMENT_CONSTANTS = {
	ALIGNMENT,
	TYPES,
};

export const blockTypeLabels = {
	default: 'Unknown',
	... insertableTypeLabels,
	mixed: 'Mixed',
	listitem: 'List item',
	tablerow: 'Row',
	tablecell: 'Cell',
	['a-table']: 'Table',
	videoembed: 'Video',
	image: 'Image',
	['float-block']: 'Float block'
};
