import { createYDoc, DEFAULT_ROOT_NAME } from '@lexical/y';
import { base64ToUint8Array } from 'uint8array-extras';

import { IndexeddbPersistence } from './IndexeddbPersistence';
import { hasLegacyContent, legacyDraftToJSON } from './legacyDraft';
import { applyRemoteUpdateV2, hasSharedContent } from './utils';

/**
 * Reads a draft saved by the Yjs 13 editor out of IndexedDB and deletes it.
 * @param {string} id
 * @returns {Promise<import('lexical').SerializedEditorState | null>}
 */
const takeLegacyDraft = async (id) => {
	const doc = createYDoc();
	const persistence = new IndexeddbPersistence(id, doc);

	await persistence.whenSynced;

	if (!hasLegacyContent(doc)) {
		await persistence.destroy();
		doc.destroy();

		return null;
	}

	const json = await legacyDraftToJSON(doc);

	await persistence.clearData();
	doc.destroy();

	return json;
};

/**
 * @typedef {{ id: string, update: string | null, initialUpdate?: string | null }} OpenArticleDocOptions
 * @typedef {{ legacyJSON: import('lexical').SerializedEditorState | null }} ArticleDocReady
 */

/**
 * The editor's Yjs document: the local draft from IndexedDB, with the article's current state
 * from the server merged into it (or the server's seed for a new article).
 * @param {OpenArticleDocOptions} options
 */
export function openArticleDoc({ id, update, initialUpdate = null }) {
	const doc = createYDoc();

	/** @type {IndexeddbPersistence | null} */
	let persistence = null;

	/** @type {Promise<ArticleDocReady>} */
	const ready = (async () => {
		const legacyJSON = await takeLegacyDraft(id);

		persistence = new IndexeddbPersistence(id, doc);
		await persistence.whenSynced;

		if (update) {
			applyRemoteUpdateV2(doc, base64ToUint8Array(update));
		} else if (initialUpdate && !hasSharedContent(doc, DEFAULT_ROOT_NAME)) {
			applyRemoteUpdateV2(doc, base64ToUint8Array(initialUpdate));
		}

		return { legacyJSON };
	})();

	return {
		doc,
		ready,
		getPersistence: () => persistence,
		destroy: async () => {
			await persistence?.destroy();
			doc.destroy();
		},
	};
}
