import { LINK_CONTENT_TYPE } from '$lib/utils/externalLink';
import { hashLink } from '$lib/utils/hashLink.server';

/**
 * @param {Prisma.PrismaClient | Prisma.Prisma.TransactionClient} tx
 * @param {{ authorId: string, urls: string[] }} arg1
 * @returns {Promise<string[]>} The links' hashes.
 */
export const createLinkContents = async (tx, { authorId, urls }) => {
	const links = urls.map((url) => ({ url, hash: hashLink(url) }));

	if (links.length) {
		await tx.content.createMany({
			data: links.map(({ url, hash }) => ({
				hash,
				name: url,
				type: LINK_CONTENT_TYPE,
				authorId,
			})),
			// Links already stored keep their author and name.
			skipDuplicates: true,
		});
	}

	return links.map(({ hash }) => hash);
};
