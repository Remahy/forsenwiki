import {
	FileQuestionMarkIcon,
	Heading1Icon,
	Heading2Icon,
	Heading3Icon,
	Heading4Icon,
	Heading5Icon,
	ListCheckIcon,
	ListIcon,
	ListOrderedIcon,
	PilcrowIcon,
	QuoteIcon,
	Rows2Icon,
	SquareSquareIcon,
	TableIcon,
	VectorSquareIcon,
	VideoIcon,
} from '@lucide/svelte';

export const blockTypeIcons = {
	default: FileQuestionMarkIcon,
	mixed: FileQuestionMarkIcon,
	unknown: FileQuestionMarkIcon,
	h1: Heading1Icon,
	h2: Heading2Icon,
	h3: Heading3Icon,
	h4: Heading4Icon,
	h5: Heading5Icon,
	bullet: ListIcon,
	number: ListOrderedIcon,
	paragraph: PilcrowIcon,
	quote: QuoteIcon,

	'float-block': SquareSquareIcon,
	'a-table': TableIcon,
	videoembed: VideoIcon,
	text: null,
	tablecell: VectorSquareIcon,
	tablerow: Rows2Icon,

	// Unused
	check: ListCheckIcon,
};
