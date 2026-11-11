import * as Y from '@y/y';
import { createYDoc, DEFAULT_ROOT_NAME } from '@lexical/y';
import * as idb from 'lib0/indexeddb';
import { base64ToUint8Array } from 'uint8array-extras';

import { IndexeddbPersistence } from './IndexeddbPersistence';
import { LEGACY_DRAFT_KEY, migrateLegacyDraft } from './legacyDraft';
import {
	convertUpdateFormatV2ToV1,
	encodeYDocToUpdateV2,
	hasLegacyData,
	hasSharedContent,
} from './utils';

/**
 * Bytes are loaded with `createYDoc` and never applied to a document: only it integrates all a
 * stored state holds (yjs/yjs#824).
 * @param {Uint8Array[]} updates V1 updates.
 */
const load = (updates) =>
	createYDoc(updates.length ? Y.mergeUpdates(/** @type {any} */ (updates)) : null);

/**
 * @param {string} base64 A V2 update.
 */
const fromServer = (base64) => convertUpdateFormatV2ToV1(base64ToUint8Array(base64));

/**
 * @param {string} id
 */
const openDraft = (id) =>
	idb.openDB(id, (db) => idb.createStores(db, [['updates', { autoIncrement: true }], ['custom']]));

/**
 * The updates of the local draft. A draft saved by the Yjs 13 editor is taken out of them, and
 * kept aside until its changes are migrated.
 * @param {IDBDatabase} db
 * @returns {Promise<Uint8Array[]>}
 */
const readDraft = async (db) => {
	const [stored] = idb.transact(db, ['updates'], 'readonly');
	const draft = /** @type {Uint8Array[]} */ (await idb.getAll(stored));

	if (!draft.length) {
		return [];
	}

	const doc = load(draft);

	try {
		if (!hasLegacyData(doc)) {
			return draft;
		}

		const [updates, custom] = idb.transact(db, ['updates', 'custom']);

		await Promise.all([
			idb.rtop(updates.clear()),
			idb.put(custom, /** @type {any} */ (encodeYDocToUpdateV2(doc)), LEGACY_DRAFT_KEY),
		]);

		return [];
	} finally {
		doc.destroy();
	}
};

/**
 * What a draft that was kept aside changed in its article, now part of the local draft.
 * @param {IDBDatabase} db
 * @param {string | null} title
 * @returns {Promise<Uint8Array | null>} A V1 update.
 */
const migrateStashedDraft = async (db, title) => {
	const [stash] = idb.transact(db, ['custom'], 'readonly');
	/** @type {any} */
	const legacyUpdate = await idb.get(stash, LEGACY_DRAFT_KEY);

	if (!legacyUpdate) {
		return null;
	}

	const migrated = await migrateLegacyDraft(title, legacyUpdate);
	const update = migrated ? convertUpdateFormatV2ToV1(migrated) : null;

	// Stored and unstashed together, so a draft is never merged twice.
	const [updates, custom] = idb.transact(db, ['updates', 'custom']);

	await Promise.all([
		update ? idb.addAutoKey(updates, /** @type {any} */ (update)) : null,
		idb.del(custom, LEGACY_DRAFT_KEY),
	]);

	return update;
};

/**
 * @param {Uint8Array[]} draft
 */
const hasContent = (draft) => {
	const doc = load(draft);

	try {
		return hasSharedContent(doc, DEFAULT_ROOT_NAME);
	} finally {
		doc.destroy();
	}
};

/**
 * @typedef {{ id: string, title?: string | null, update: string | null, initialUpdate?: string | null }} OpenArticleDocOptions
 * @typedef {Awaited<ReturnType<typeof openArticleDoc>>} ArticleDoc
 */

/**
 * The editor's Yjs document: the local draft from IndexedDB, with the article's current state
 * from the server merged into it (or the server's seed for a new article).
 * @param {OpenArticleDocOptions} options
 */
export async function openArticleDoc({ id, title = null, update, initialUpdate = null }) {
	const db = await openDraft(id);

	/** @type {Uint8Array[]} */
	let updates;
	let legacyDraftFailed = false;

	try {
		updates = await readDraft(db);

		try {
			const migrated = await migrateStashedDraft(db, title);

			if (migrated) {
				updates.push(migrated);
			}
		} catch (err) {
			console.error(err);
			legacyDraftFailed = true;
		}
	} finally {
		db.close();
	}

	if (update) {
		updates.push(fromServer(update));
	} else if (initialUpdate && !hasContent(updates)) {
		updates.push(fromServer(initialUpdate));
	}

	const doc = load(updates);
	const persistence = new IndexeddbPersistence(id, doc);

	await persistence.whenSynced;

	return {
		doc,
		persistence,
		legacyDraftFailed,
		destroy: async () => {
			await persistence.destroy();
			doc.destroy();
		},
	};
}
