import prisma from '$lib/prisma.server';
import { ACTIVITY_TYPES } from '$lib/constants/activity';
import { createActivity } from '$lib/db/activity/create';

/**
 * @param {string} id
 * @param {string} name
 * @param {string} userId
 */
export const updateContentName = async (id, name, userId) => {
	return prisma.$transaction(async (tx) => {
		const { name: oldName } = await tx.content.findUniqueOrThrow({
			where: { id },
			select: { name: true },
		});

		const updated = await tx.content.update({
			where: { id },
			data: { name },
			select: { name: true },
		});

		const recorded =
			oldName !== updated.name && (await tx.activity.count({ where: { contentId: id } }));

		const activity = recorded
			? await createActivity(tx, {
					type: ACTIVITY_TYPES.CONTENT_RENAME,
					userId,
					contentId: id,
					oldName,
					newName: updated.name,
				})
			: null;

		return { content: updated, activity };
	});
};
