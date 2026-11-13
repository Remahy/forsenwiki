import { $getEditor } from 'lexical';

import { articleExtension } from '$lib/components/editor/config/article';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';
import { $patchEditorState, $replaceEditorState, sameContent } from '$lib/lexical/patchEditorState';
import { getYAndEditor, readState, seedFromJSON } from '$lib/y/headless';
import { diffUpdateUsingStateVectorV2, getStateVectorFromUpdateV2 } from '$lib/y/utils';

import { legacyUpdateToJSON } from './legacyUpdateToJSON';
import { mergePostUpdatesV2 } from './utils';

const config = () => articleExtension(null, EDITOR_IS_READONLY, null);

const $json = () => $getEditor().getEditorState().toJSON();

/**
 * @param {Uint8Array} updateV2
 */
export const convertLegacyUpdate = (updateV2) =>
	seedFromJSON(config(), legacyUpdateToJSON(updateV2));

/**
 * @param {Uint8Array} updateV2
 */
const converted = (updateV2) => readState(config(), convertLegacyUpdate(updateV2), $json);

/**
 * @typedef {Object} LegacyChanges
 * @property {Uint8Array | null} legacyArticle
 * @property {Uint8Array} legacyUpdate
 * @property {Uint8Array} base What `legacyArticle` was converted to.
 */

/**
 * Written as a patch of `base`, so it merges with the edits made since the conversion.
 * @param {LegacyChanges} changes
 * @returns {Promise<Uint8Array | null>} V2 update, null when nothing changed.
 */
export async function migrateLegacyChanges({ legacyArticle, legacyUpdate, base }) {
	const after = converted(
		legacyArticle ? mergePostUpdatesV2([legacyArticle, legacyUpdate]) : legacyUpdate
	);

	if (legacyArticle && sameContent(converted(legacyArticle), after)) {
		return null;
	}

	const article = getYAndEditor(config(), base);

	try {
		const { editor } = article;
		const before = editor.getEditorState().toJSON();

		if (sameContent(before, after)) {
			return null;
		}

		editor.update(() => $patchEditorState(before, after), { discrete: true });

		if (!sameContent(editor.getEditorState().toJSON(), after)) {
			editor.update(() => $replaceEditorState(after), { discrete: true });
		}

		return diffUpdateUsingStateVectorV2(await article.encodeV2(), getStateVectorFromUpdateV2(base));
	} finally {
		article.dispose();
	}
}
