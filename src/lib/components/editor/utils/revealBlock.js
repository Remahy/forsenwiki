import { $getBlockById } from '@lexical/extension';

const HIGHLIGHT = [
	{ outline: '3px solid rgb(220 38 38)', outlineOffset: '2px' },
	{ outline: '3px solid transparent', outlineOffset: '2px' },
];

/**
 * Scrolls to a block and outlines it for a moment.
 * @param {LexicalEditor} editor
 * @param {string} blockId
 */
export const revealBlock = (editor, blockId) => {
	const key = editor.read(() => $getBlockById(blockId)?.getKey());
	const element = key ? editor.getElementByKey(key) : null;

	if (!element) {
		return false;
	}

	element.scrollIntoView({ block: 'center', behavior: 'smooth' });
	element.animate?.(HIGHLIGHT, { duration: 2000, easing: 'ease-in' });

	return true;
};
