import { migrateWSRVImages } from './migrateWSRVImages';

/**
 * @param {LexicalEditor} editor
 */
export const migrations = (editor) => {
	migrateWSRVImages(editor);
};
