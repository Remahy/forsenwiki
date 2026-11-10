// Drafts saved by the Yjs 13 editor. Remove together with the client's `yjs` and `@lexical/yjs` imports.
import { encodeYDocToUpdateV2, hasSharedContent } from './utils';

const LEGACY_ROOTS = ['root', 'root-v2'];

/**
 * @param {YDoc} doc
 */
export const hasLegacyContent = (doc) => LEGACY_ROOTS.some((name) => hasSharedContent(doc, name));

/**
 * @param {YDoc} doc
 * @returns {Promise<import('lexical').SerializedEditorState>}
 */
export const legacyDraftToJSON = async (doc) => {
	const { legacyUpdateToJSON } = await import('$lib/yjs/legacyUpdateToJSON');

	return legacyUpdateToJSON(encodeYDocToUpdateV2(doc));
};
