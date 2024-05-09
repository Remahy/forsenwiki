import { HeadingNode, QuoteNode, } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list'
import { ALinkNode } from '../plugins/ALink';

const articleTheme = {
	paragraph: 'm-0'
};

/** 
 * @param {Error} error
 * @returns {void}
 */
const onErrorDefault = (error) => {
	throw error;
}

/**
 * @param {any} theme
 * @param {boolean} editable
 * @param {any} editorState
 * @param {typeof onErrorDefault} onError
 */
export const articleConfig = (theme = articleTheme, editable, editorState, onError = onErrorDefault) => ({
	theme,
	namespace: 'editor',
	editable,
	nodes: [ALinkNode, ListNode, ListItemNode, HeadingNode, QuoteNode],
	/** @param {Error} error */
	onError,
	editorState
});
