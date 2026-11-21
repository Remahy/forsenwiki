import { error } from '@sveltejs/kit';

export class InvalidImagesError extends Error {
	/**
	 * @param {string} message
	 * @param {string[]} blockIds
	 */
	constructor(message, blockIds) {
		super(message);
		this.blockIds = blockIds;
	}
}

/** @param {InvalidImagesError} err */
export const InvalidImagesResponse = (err) => {
	error(400, { message: err.message, blockIds: err.blockIds });
};
