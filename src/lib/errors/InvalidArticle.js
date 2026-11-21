import { error } from '@sveltejs/kit';

export class InvalidArticleError extends Error {
	/**
	 * @param {string} message
	 * @param {{ blocks?: ErrorBlock[] }} [details]
	 */
	constructor(message, { blocks = [] } = {}) {
		super(message);
		this.blocks = blocks;
	}
}

/** @param {InvalidArticleError} err */
export const InvalidArticleResponse = (err) => {
	error(400, { message: err.message, blocks: err.blocks });
};
