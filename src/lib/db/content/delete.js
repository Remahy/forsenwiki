import prisma from '$lib/prisma.server';
import { ACTIVITY_TYPES } from '$lib/constants/activity';
import { createActivity } from '$lib/db/activity/create';
import { ContentInUseError } from '$lib/errors/ContentInUse';
import { ContentProtectedError } from '$lib/errors/ContentProtected';
import { isForeignKeyViolation } from '$lib/db/isForeignKeyViolation';
import { WIKI_LINK_HASH } from '$lib/constants/content.server';

/**
 * @typedef {{ id: string, hash: string, name: string, type: string | null, contentType: string | null, contentLength: number | null, metadata: Prisma.Prisma.JsonValue }} ContentSnapshot
 */

/**
 * Content no activity points to, such as a failed upload.
 * Content an article uses, and the VITE_DOMAIN link, are refused.
 * @param {string} id
 * @param {string} userId
 */
export const deleteContent = async (id, userId) => {
	try {
		return await deleteUnusedContent(id, userId);
	} catch (err) {
		// The database refuses it when an article saved in the meantime uses it.
		if (isForeignKeyViolation(err)) {
			throw ContentInUseError();
		}

		throw err;
	}
};

/**
 * @param {string} id
 * @param {string} userId
 */
const deleteUnusedContent = (id, userId) => {
	return prisma.$transaction(async (tx) => {
		const usages = await tx.yPostContent.count({ where: { contentId: id } });

		if (usages) {
			throw ContentInUseError(usages);
		}

		const { contentLength, ...content } = await tx.content.findUniqueOrThrow({
			where: { id },
			select: {
				id: true,
				hash: true,
				name: true,
				type: true,
				contentType: true,
				contentLength: true,
				metadata: true,
			},
		});

		if (content.hash === WIKI_LINK_HASH) {
			throw ContentProtectedError();
		}

		/** @type {ContentSnapshot} */
		const contentSnapshot = {
			...content,
			contentLength: contentLength === null ? null : Number(contentLength),
		};

		const { count } = await tx.activity.updateMany({
			where: { contentId: id },
			data: { contentSnapshot },
		});

		const activity = count
			? await createActivity(tx, { type: ACTIVITY_TYPES.CONTENT_DELETE, userId, contentSnapshot })
			: null;

		await tx.content.delete({ where: { id } });

		return { content, activity };
	});
};
