import { migrations } from '../migrations';
import { adjustImages } from './images';
import { validateArticle } from './validateArticle';
import { adjustVideoEmbedNodeSiblings } from './videos';

/**
 * @param {LexicalEditor} editor
 */
export const runValidations = async (editor) => {
	// Does not modify the editor.
	validateArticle(editor);

	// Modifies the editor.
	migrations(editor);
	await adjustImages(editor);
	await adjustVideoEmbedNodeSiblings(editor);
};
