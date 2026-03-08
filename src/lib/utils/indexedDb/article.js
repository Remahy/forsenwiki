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
