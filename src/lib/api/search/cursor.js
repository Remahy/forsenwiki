/** @typedef {{ createdTimestamp: Date, id: string }} SearchCursor */

/**
 * @param {{ createdTimestamp: Date | string, id: string }} result
 */
export const toCursor = ({ createdTimestamp, id }) =>
	`${new Date(createdTimestamp).toISOString()}_${id}`;

/**
 * @param {string | null} cursor
 * @returns {SearchCursor | null}
 */
export const parseCursor = (cursor) => {
	const split = cursor?.indexOf('_') ?? -1;
	if (!cursor || split < 0) {
		return null;
	}

	const createdTimestamp = new Date(cursor.slice(0, split));
	const id = cursor.slice(split + 1);
	if (Number.isNaN(createdTimestamp.getTime()) || !id) {
		return null;
	}

	return { createdTimestamp, id };
};
