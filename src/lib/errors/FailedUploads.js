import { error } from '@sveltejs/kit';

/**
 * @param {number} count
 * @param {string[]} blockIds
 */
export const FailedUploadsError = (count, blockIds) => {
	error(400, {
		message:
			count === 1
				? "An image in this article doesn't exist or failed to upload. Remove or replace it and save again."
				: `${count} images in this article don't exist or failed to upload. Remove or replace them and save again.`,
		blockIds,
		blockLabel: 'image',
	});
};
