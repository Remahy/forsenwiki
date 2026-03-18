import { runValidations } from './index';
import { adjustInternalLinks } from './internalLinks.server';

/**
 * @param {LexicalEditor} editor
 */
export const serverRunValidations = async (editor) => {
	await runValidations(editor);

	// Modifies the editor.
	await adjustInternalLinks(editor);
};
