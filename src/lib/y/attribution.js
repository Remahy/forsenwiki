import * as Y from '@y/y';
import { base64ToUint8Array } from 'uint8array-extras';

/**
 * @typedef {Object} AttributableRow
 * @property {string} content Base64 V2 update.
 * @property {Date} createdTimestamp
 * @property {{ userId: string }} metadata
 */

/**
 * What each row of an update chain inserted and deleted, attributed to the row's author.
 * @param {AttributableRow[]} rows In the order they were stored.
 * @returns {Y.ContentMap[]} One per row.
 */
export function attributeRows(rows) {
	let seen = Y.createContentIds();

	return rows.map(({ content, createdTimestamp, metadata }) => {
		const contentIds = Y.createContentIdsFromUpdateV2(base64ToUint8Array(content));
		const own = Y.excludeContentIds(contentIds, seen);
		const at = createdTimestamp.getTime();

		seen = Y.mergeContentIds([seen, contentIds]);

		return Y.createContentMapFromContentIds(
			own,
			[
				Y.createContentAttribute('insert', metadata.userId),
				Y.createContentAttribute('insertAt', at),
			],
			[
				Y.createContentAttribute('delete', metadata.userId),
				Y.createContentAttribute('deleteAt', at),
			]
		);
	});
}
