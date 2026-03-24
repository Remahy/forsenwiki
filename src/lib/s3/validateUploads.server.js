import { STATIC_DOMAIN } from '$lib/environment/environment';
import prisma from '$lib/prisma';

/**
 * @param {Array<{ index: number, hash: string }>} hashes
 */
export const validateUploads = async (hashes) => {
	// Validate all exist on S3.
	let existsPromises = [];
	for (let index = 0; index < hashes.length; index++) {
		const { hash } = hashes[index];

		existsPromises.push(fetch(`${STATIC_DOMAIN}/${hash}`, { method: 'HEAD' }));
	}

	const responses = await Promise.all(existsPromises);

	let failedUploads = [];
	for (let index = 0; index < responses.length; index++) {
		const response = responses[index];

		if (response.status !== 200) {
			failedUploads.push({ ...hashes[index] });
		}
	}

	return failedUploads;
};

/**
 * @param {string[]} hashes
 * @param {string} authorId
 */
export const pruneFailedUploads = (hashes, authorId) => {
	return prisma.content.deleteMany({ where: { hash: { in: hashes }, authorId } });
};
