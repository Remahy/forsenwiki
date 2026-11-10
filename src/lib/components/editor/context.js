import { getContext, setContext } from 'svelte';

const EDITOR_KEY = 'editor';

/**
 * @returns {LexicalEditor}
 */
export const getEditor = () => getContext(EDITOR_KEY);

/**
 * @param {LexicalEditor} editor
 */
export const setEditor = (editor) => {
	setContext(EDITOR_KEY, editor);
};
