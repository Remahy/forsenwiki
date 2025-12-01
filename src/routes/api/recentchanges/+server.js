import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { getRecentChangesFilters } from '$lib/utils/recentChanges';

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
					user: {
						select: {
							name: true,
						},
					},
				},
			},
		},
		orderBy: {
			createdTimestamp: 'desc',
		},
		cursor: cursor
			? {
					id: cursor,
				}
			: undefined,
		skip: cursor ? 1 : undefined,
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
		// Not a typo, technically an update's "createdTimestamp" *is* a yPost's lastUpdated.
		lastUpdated: update.createdTimestamp.toString(),
	}));

	return recentChanges;
};

export async function GET({ url }) {
	const filters = getRecentChangesFilters(url.searchParams);

	const response = await _getRecentChanges(filters);

	return json(response);
}
