import { articleExtension } from '$lib/components/editor/config/article';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';

import { getYjsAndEditor } from './getYjsAndEditor';

/**
 * Reads a Yjs 13 (`@lexical/yjs`) article into Lexical JSON.
 * @param {Uint8Array} updateV2
 * @returns {import('lexical').SerializedEditorState}
 */
export const legacyUpdateToJSON = (updateV2) => {
	const { editor, doc } = getYjsAndEditor(
		articleExtension(null, EDITOR_IS_READONLY, null),
		updateV2
	);

	const json = editor.getEditorState().toJSON();

	/** @type {any} */ (editor).dispose?.();
	doc.destroy();

	return json;
};
