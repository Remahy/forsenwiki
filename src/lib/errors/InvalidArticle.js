import { error } from '@sveltejs/kit';

export class InvalidArticleError extends Error {
	/**
	 * @param {string} message
	 * @param {{ blockIds?: string[], blockLabel?: string }} [blocks] `blockLabel` names what the blocks hold, e.g. "image".
	 */
	constructor(message, { blockIds = [], blockLabel = 'block' } = {}) {
		super(message);
		this.blockIds = blockIds;
		this.blockLabel = blockLabel;
	}
}

/** @param {InvalidArticleError} err */
export const InvalidArticleResponse = (err) => {
	error(400, { message: err.message, blockIds: err.blockIds, blockLabel: err.blockLabel });
};
