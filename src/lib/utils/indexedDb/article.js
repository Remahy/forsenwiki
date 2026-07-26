import { DRAFT_CONTENT_DB_PREFIX } from './content';

/**
 * @param {string} name
 */
export const resetArticle = (name) => {
	return new Promise((resolve, reject) => {
		const dbDelete = window.indexedDB.deleteDatabase(name);

		dbDelete.onerror = () => {
			reject(new Error('Error deleting draft.'));
		};

		dbDelete.onsuccess = () => {
			resolve(true);
		};
	});
};

export const listArticles = async () => {
	const databases = await window.indexedDB.databases();

	return /** @type {Array<{ name: string }>} */ (
		databases
			.map((e) => ({ name: e.name }))
			.filter(({ name }) => !name?.startsWith(`${DRAFT_CONTENT_DB_PREFIX}-`))
	);
};
