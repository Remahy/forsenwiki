import prisma from '$lib/prisma.server';
import { ACTIVITY_TYPES } from '$lib/constants/activity';
import { createActivity } from '$lib/db/activity/create';
import { ErrorWithCode } from '$lib/errors/ErrorWithCode';
import { CONTENT_IN_USE, CONTENT_PROTECTED } from '$lib/constants/content';
import { WIKI_LINK_HASH } from '$lib/constants/content.server';

/**
 * @typedef {{ id: string, hash: string, name: string, type: string | null, contentType: string | null, contentLength: number | null, metadata: Prisma.Prisma.JsonValue }} ContentSnapshot
 */

/**
 * Content no activity points to, such as a failed upload. Content an article uses, and the VITE_DOMAIN link, are refused.
 * @param {string} id
 * @param {string} userId
 */
export const deleteContent = async (id, userId) => {
	return prisma.$transaction(async (tx) => {
		const usages = await tx.yPostContent.count({ where: { contentId: id } });

		if (usages) {
			const err = new ErrorWithCode(
				`This content is used in ${usages} article${usages === 1 ? '' : 's'} and cannot be deleted. Remove it from them first.`
			);
			err.code = CONTENT_IN_USE;
			throw err;
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
			const err = new ErrorWithCode('The link to the wiki itself cannot be deleted.');
			err.code = CONTENT_PROTECTED;
			throw err;
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
