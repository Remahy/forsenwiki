import prisma from '$lib/prisma.server';

const fields = /** @satisfies {Prisma.Prisma.ActivitySelect} */ ({
	id: true,
	type: true,
	explanation: true,
	createdTimestamp: true,
	user: { select: { id: true, name: true } },
	post: { select: { title: true, rawTitle: true } },
	postUpdate: {
		select: {
			id: true,
			metadata: { select: { byteLength: true, newTitle: true, oldTitle: true } },
		},
	},
});

const select = /** @satisfies {Prisma.Prisma.ActivitySelect} */ ({
	...fields,
	children: {
		select: fields,
		orderBy: [
			{ createdTimestamp: /** @type {const} */ ('asc') },
			{ id: /** @type {const} */ ('asc') },
		],
	},
});

/**
 * @typedef {Prisma.Prisma.ActivityGetPayload<{ select: typeof fields }>} ActivityRow
 *
 * @typedef {{
 *   id: string,
 *   type: import('$lib/constants/activity').ActivityType,
 *   explanation: string | null,
 *   createdTimestamp: string,
 *   user: { id: string, name: string | null } | null,
 *   post: { title: string, rawTitle: string } | null,
 *   postUpdate: { id: string, byteLength: bigint | null, newTitle: string | null, oldTitle: string | null } | null,
 * }} ChildActivityEntry
 *
 * @typedef {ChildActivityEntry & { children: ChildActivityEntry[] }} ActivityEntry
 */

/**
 * @param {ActivityRow} row
 * @returns {ChildActivityEntry}
 */
const toChildEntry = ({ createdTimestamp, postUpdate, ...row }) => ({
	...row,
	createdTimestamp: createdTimestamp.toISOString(),
	postUpdate: postUpdate && { id: postUpdate.id, ...postUpdate.metadata },
});

/**
 * @param {ActivityRow & { children: ActivityRow[] }} row
 * @returns {ActivityEntry}
 */
const toEntry = ({ children, ...row }) => ({
	...toChildEntry(row),
	children: children.map(toChildEntry),
});

/**
 * Do not list child activities on their own.
 * @param {ReturnType<import('$lib/utils/activity').getActivityFilters>} filters
 */
export const readActivities = async ({ authors, types, cursor, limit }) => {
	const rows = await prisma.activity.findMany({
		select,
		where: {
			parentId: null,
			...(authors.length ? { user: { name: { in: authors } } } : {}),
			...(types.length
				? { OR: [{ type: { in: types } }, { children: { some: { type: { in: types } } } }] }
				: {}),
		},
		orderBy: [{ createdTimestamp: 'desc' }, { id: 'desc' }],
		...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
		take: limit,
	});

	return rows.map(toEntry);
};

/**
 * @param {Prisma.Prisma.ActivityWhereInput} where
 */
export const readActivity = async (where) => {
	const row = await prisma.activity.findFirst({ select, where: { ...where, parentId: null } });

	return row && toEntry(row);
};
