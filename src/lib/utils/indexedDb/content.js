const DRAFT_CONTENT_DB_PREFIX = 'DraftContent';
const DRAFT_CONTENT_DB_KEY = 'content';

const hashCache = new Map();

/**
 * @param {string} articleId
 * @returns {Promise<IDBDatabase>}
 */
const openDB = (articleId) => {
	return new Promise((resolve, reject) => {
		const request = window.indexedDB.open(`${DRAFT_CONTENT_DB_PREFIX}-${articleId}`, 1);

		request.onupgradeneeded = function (event) {
			// @ts-ignore
			const db = event.target.result;

			if (!db.objectStoreNames.contains(DRAFT_CONTENT_DB_KEY)) {
				db.createObjectStore(DRAFT_CONTENT_DB_KEY, { keyPath: 'hash' });
			}
		};

		request.onsuccess = function () {
			resolve(request.result);
		};

		request.onerror = function () {
			reject(request.error);
		};
	});
};

/**
 * @param {string} articleId
 * @param {string} hash
 * @param {Blob} image
 */
export const saveContent = async (articleId, hash, image) => {
	const db = await openDB(articleId);

	const transaction = db.transaction(DRAFT_CONTENT_DB_KEY, 'readwrite');
	const store = transaction.objectStore(DRAFT_CONTENT_DB_KEY);

	store.put({ hash, image });

	return new Promise((resolve, reject) => {
		transaction.oncomplete = () => {
			resolve(hash);
		};

		transaction.onerror = reject;
		transaction.onabort = reject;
	});
};

/**
 * @param {string} articleId
 * @param {string} hash
 * @returns {Promise<Blob & { url: string }>}
 */
export const loadContent = (articleId, hash) => {
	const cache = hashCache.get(hash);

	if (cache) {
		return cache;
	}

	const promise = new Promise(async (resolve, reject) => {
		const db = await openDB(articleId);

		const transaction = db.transaction(DRAFT_CONTENT_DB_KEY, 'readonly');
		const store = transaction.objectStore(DRAFT_CONTENT_DB_KEY);

		const request = store.get(hash);

		request.onsuccess = function () {
			const result = request.result;
			if (result) {
				const imageURL = URL.createObjectURL(result.image);
				resolve({ ...result.image, url: imageURL });
			} else {
				reject(null);
			}
		};
	});

	hashCache.set(hash, promise);

	return hashCache.get(hash);
};

/**
 * @param {string} articleId
 * @returns {Promise<boolean>}
 */
export const resetContent = async (articleId) => {
	return new Promise((resolve, reject) => {
		const dbDelete = window.indexedDB.deleteDatabase(`${DRAFT_CONTENT_DB_PREFIX}-${articleId}`);

		dbDelete.onerror = () => {
			reject(new Error('Error deleting draft.'));
		};

		dbDelete.onsuccess = () => {
			resolve(true);
		};
	});
};
