import * as Y from '@y/y';
import { createYDoc, DEFAULT_ROOT_NAME } from '@lexical/y';
import * as idb from 'lib0/indexeddb';
import { base64ToUint8Array } from 'uint8array-extras';

import { IndexeddbPersistence } from './IndexeddbPersistence';
import { LEGACY_DRAFT_KEY, migrateLegacyDraft } from './legacyDraft';
import {
	applyRemoteUpdateV2,
	convertUpdateFormatV2ToV1,
	encodeYDocToUpdateV2,
	hasLegacyData,
	hasSharedContent,
} from './utils';

/**
 * @param {IndexeddbPersistence} persistence
 */
const stores = (persistence) =>
	idb.transact(/** @type {IDBDatabase} */ (persistence.db), ['updates', 'custom']);

/**
 * Takes a draft saved by the Yjs 13 editor out of the updates the document loads, and keeps it
 * aside until its changes are migrated.
 * @param {string} id
 */
const stashLegacyDraft = async (id) => {
	const doc = createYDoc();
	const persistence = new IndexeddbPersistence(id, doc);

	await persistence.whenSynced;

	if (hasLegacyData(doc)) {
		const [updates, custom] = stores(persistence);

		await Promise.all([
			idb.rtop(updates.clear()),
			idb.put(custom, /** @type {any} */ (encodeYDocToUpdateV2(doc)), LEGACY_DRAFT_KEY),
		]);
	}

	await persistence.destroy();
	doc.destroy();
};

/**
 * Merges what a stashed draft changed into the document, as part of the local draft.
 * @param {IndexeddbPersistence} persistence
 * @param {YDoc} doc
 * @param {string | null} title
 */
const applyLegacyDraft = async (persistence, doc, title) => {
	/** @type {Uint8Array | undefined} */
	const legacyUpdate = await persistence.get(LEGACY_DRAFT_KEY);

	if (!legacyUpdate) {
		return;
	}

	const migrated = await migrateLegacyDraft(title, legacyUpdate);
	const update = migrated ? convertUpdateFormatV2ToV1(migrated) : null;

	// Stored and unstashed together, so a draft is never merged twice.
	const [updates, custom] = stores(persistence);

	await Promise.all([
		update ? idb.addAutoKey(updates, /** @type {any} */ (update)) : null,
		idb.del(custom, LEGACY_DRAFT_KEY),
	]);

	if (update) {
		Y.applyUpdate(doc, update, persistence);
	}
};

/**
 * @typedef {{ id: string, title?: string | null, update: string | null, initialUpdate?: string | null }} OpenArticleDocOptions
 * @typedef {{ legacyDraftFailed: boolean }} ArticleDocReady
 */

/**
 * The editor's Yjs document: the local draft from IndexedDB, with the article's current state
 * from the server merged into it (or the server's seed for a new article).
 * @param {OpenArticleDocOptions} options
 */
export function openArticleDoc({ id, title = null, update, initialUpdate = null }) {
	const doc = createYDoc();

	/** @type {IndexeddbPersistence | null} */
	let persistence = null;

	/** @type {Promise<ArticleDocReady>} */
	const ready = (async () => {
		await stashLegacyDraft(id);

		persistence = new IndexeddbPersistence(id, doc);
		await persistence.whenSynced;

		if (update) {
			applyRemoteUpdateV2(doc, base64ToUint8Array(update));
		} else if (initialUpdate && !hasSharedContent(doc, DEFAULT_ROOT_NAME)) {
			applyRemoteUpdateV2(doc, base64ToUint8Array(initialUpdate));
		}

		try {
			await applyLegacyDraft(persistence, doc, title);
		} catch (err) {
			console.error(err);

			return { legacyDraftFailed: true };
		}

		return { legacyDraftFailed: false };
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
