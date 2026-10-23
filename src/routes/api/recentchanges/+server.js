import prisma from '#lib/prisma.server.js';
import { getRecentChangesFilters } from '#lib/utils/recentChanges.js';
import { replacer } from '#lib/utils/json.js';

/**
 * @param {ReturnType<getRecentChangesFilters>} filters
 */
export const _getRecentChanges = async ({ authors, cursor, limit }) => {
	const yPostUpdates = await prisma.yPostUpdate.findMany({
		select: {
			id: true,
			createdTimestamp: true,
			post: {
				select: {
					title: true,
					rawTitle: true,
				},
			},
			metadata: {
				select: {
					byteLength: true,
					newTitle: true,
					oldTitle: true,
					user: {
						select: {
							name: true,
							id: true,
						},
					},
				},
			},
		},
		orderBy: [{ createdTimestamp: 'desc' }, { id: 'desc' }],
		...(cursor
			? {
					cursor: {
						id: cursor,
					},
					skip: 1,
				}
			: {}),
		take: limit,
		where: authors.length
			? {
					metadata: {
						user: {
							name: {
								in: authors,
							},
						},
					},
				}
			: undefined,
	});

	const recentChanges = yPostUpdates.map((update) => ({
		...update.post,
		id: update.id,
		author: update.metadata.user.name,
		authorId: update.metadata.user.id,
		// Not a typo, technically an update's "createdTimestamp" *is* a yPost's lastUpdated.
		lastUpdated: update.createdTimestamp.toString(),
		byteLength: update.metadata.byteLength,
		newTitle: update.metadata.newTitle,
		oldTitle: update.metadata.oldTitle,
	}));

	return recentChanges;
};

export async function GET({ url }) {
	const filters = getRecentChangesFilters(url.searchParams);

	const res = await _getRecentChanges(filters);

	const safeJSON = JSON.parse(JSON.stringify(res, replacer));

	return Response.json(safeJSON);
}
