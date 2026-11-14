// y-indexeddb (MIT, Kevin Jahns) on @y/y, since the published package only works with Yjs 13.
import * as Y from '@y/y';
import * as idb from 'lib0/indexeddb';
import * as promise from 'lib0/promise';
import { Observable } from 'lib0/observable';

const customStoreName = 'custom';
const updatesStoreName = 'updates';

export const PREFERRED_TRIM_SIZE = 500;

/**
 * @param {IndexeddbPersistence} idbPersistence
 * @param {(store: IDBObjectStore) => void} [beforeApplyUpdatesCallback]
 * @param {(store: IDBObjectStore) => void} [afterApplyUpdatesCallback]
 */
export const fetchUpdates = (
	idbPersistence,
	beforeApplyUpdatesCallback = () => {},
	afterApplyUpdatesCallback = () => {}
) => {
	const [updatesStore] = idb.transact(/** @type {IDBDatabase} */ (idbPersistence.db), [
		updatesStoreName,
	]);

	return idb
		.getAll(updatesStore, idb.createIDBKeyRangeLowerBound(idbPersistence._dbref, false))
		.then((updates) => {
			if (!idbPersistence._destroyed) {
				beforeApplyUpdatesCallback(updatesStore);
				Y.transact(
					idbPersistence.doc,
					() => {
						updates.forEach((val) => Y.applyUpdate(idbPersistence.doc, val));
					},
					idbPersistence,
					false
				);
				afterApplyUpdatesCallback(updatesStore);
			}
		})
		.then(() =>
			idb.getLastKey(updatesStore).then((lastKey) => {
				idbPersistence._dbref = lastKey + 1;
			})
		)
		.then(() =>
			idb.count(updatesStore).then((cnt) => {
				idbPersistence._dbsize = cnt;
			})
		)
		.then(() => updatesStore);
};

/**
 * @param {IndexeddbPersistence} idbPersistence
 * @param {boolean} forceStore
 */
export const storeState = (idbPersistence, forceStore = true) =>
	fetchUpdates(idbPersistence).then((updatesStore) => {
		if (forceStore || idbPersistence._dbsize >= PREFERRED_TRIM_SIZE) {
			idb
				.addAutoKey(updatesStore, /** @type {any} */ (Y.encodeStateAsUpdate(idbPersistence.doc)))
				.then(() =>
					idb.del(updatesStore, idb.createIDBKeyRangeUpperBound(idbPersistence._dbref, true))
				)
				.then(() =>
					idb.count(updatesStore).then((cnt) => {
						idbPersistence._dbsize = cnt;
					})
				);
		}
	});

/**
 * @param {string} name
 */
export const clearDocument = (name) => idb.deleteDB(name);

/**
 * @extends Observable<string>
 */
export class IndexeddbPersistence extends Observable {
	/**
	 * @param {string} name
	 * @param {Y.Doc} doc
	 */
	constructor(name, doc) {
		super();
		this.doc = doc;
		this.name = name;
		this._dbref = 0;
		this._dbsize = 0;
		this._destroyed = false;
		/** @type {IDBDatabase | null} */
		this.db = null;
		this.synced = false;
		this._db = idb.openDB(name, (db) =>
			idb.createStores(db, [['updates', { autoIncrement: true }], ['custom']])
		);
		/** @type {Promise<IndexeddbPersistence>} */
		this.whenSynced = promise.create((resolve) => this.on('synced', () => resolve(this)));

		this._db.then((db) => {
			this.db = db;
			/** @param {IDBObjectStore} updatesStore */
			const beforeApplyUpdatesCallback = (updatesStore) =>
				idb.addAutoKey(updatesStore, /** @type {any} */ (Y.encodeStateAsUpdate(doc)));
			const afterApplyUpdatesCallback = () => {
				if (this._destroyed) {
					return this;
				}
				this.synced = true;
				this.emit('synced', [this]);
			};
			fetchUpdates(this, beforeApplyUpdatesCallback, afterApplyUpdatesCallback);
		});
		/** Timeout in ms until data is merged and persisted in idb. */
		this._storeTimeout = 1000;
		/** @type {any} */
		this._storeTimeoutId = null;
		/**
		 * @param {Uint8Array} update
		 * @param {any} origin
		 */
		this._storeUpdate = (update, origin) => {
			if (this.db && origin !== this) {
				const [updatesStore] = idb.transact(/** @type {IDBDatabase} */ (this.db), [
					updatesStoreName,
				]);
				idb.addAutoKey(updatesStore, /** @type {any} */ (update));
				if (++this._dbsize >= PREFERRED_TRIM_SIZE) {
					if (this._storeTimeoutId !== null) {
						clearTimeout(this._storeTimeoutId);
					}
					this._storeTimeoutId = setTimeout(() => {
						storeState(this, false);
						this._storeTimeoutId = null;
					}, this._storeTimeout);
				}
			}
		};
		doc.on('update', this._storeUpdate);
		this.destroy = this.destroy.bind(this);
		doc.on('destroy', this.destroy);
	}

	destroy() {
		if (this._storeTimeoutId) {
			clearTimeout(this._storeTimeoutId);
		}
		this.doc.off('update', this._storeUpdate);
		this.doc.off('destroy', this.destroy);
		this._destroyed = true;
		return this._db.then((db) => {
			db.close();
		});
	}

	/**
	 * Destroys this instance and removes all data from indexeddb.
	 * @return {Promise<void>}
	 */
	clearData() {
		return this.destroy().then(() => idb.deleteDB(this.name));
	}

	/**
	 * @param {string | number | ArrayBuffer | Date} key
	 * @return {Promise<any>}
	 */
	get(key) {
		return this._db.then((db) => {
			const [custom] = idb.transact(db, [customStoreName], 'readonly');
			return idb.get(custom, key);
		});
	}

	/**
	 * @param {string | number | ArrayBuffer | Date} key
	 * @param {string | number | ArrayBuffer | Date} value
	 * @return {Promise<string | number | ArrayBuffer | Date>}
	 */
	set(key, value) {
		return this._db.then((db) => {
			const [custom] = idb.transact(db, [customStoreName]);
			return idb.put(custom, value, key);
		});
	}

	/**
	 * @param {string | number | ArrayBuffer | Date} key
	 * @return {Promise<undefined>}
	 */
	del(key) {
		return this._db.then((db) => {
			const [custom] = idb.transact(db, [customStoreName]);
			return idb.del(custom, key);
		});
	}
}
