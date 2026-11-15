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
	content: {
		select: {
			id: true,
			hash: true,
			name: true,
			type: true,
			contentType: true,
			contentLength: true,
			metadata: true,
		},
	},
	contentSnapshot: true,
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
 *   content: { id: string, hash: string, name: string, type: string | null, contentType: string | null, contentLength: bigint | null, metadata?: Prisma.Prisma.JsonValue, deleted: boolean } | null,
 * }} ChildActivityEntry
 *
 * @typedef {ChildActivityEntry & { children: ChildActivityEntry[] }} ActivityEntry
 */

/**
 * @typedef {{ isModerator: boolean }} Viewer
 */

/**
 * @param {ActivityRow} row
 * @returns {ChildActivityEntry['content']}
 */
const toContent = ({ content, contentSnapshot }) => {
	if (content) {
		return { ...content, deleted: false };
	}

	if (!contentSnapshot) {
		return null;
	}

	const { contentLength, ...snapshot } =
		/** @type {import('$lib/db/content/delete').ContentSnapshot} */ (contentSnapshot);

	return {
		...snapshot,
		contentLength: contentLength === null ? null : BigInt(contentLength),
		deleted: true,
	};
};

/**
 * Same rule as /api/content/validate/[hash]: only moderators see content metadata.
 * @param {ActivityRow} row
 * @param {Viewer} viewer
 * @returns {ChildActivityEntry}
 */
const toChildEntry = (row, { isModerator }) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { createdTimestamp, postUpdate, content: _content, contentSnapshot, ...rest } = row;

	let visibleContent = toContent(row);

	if (visibleContent && !isModerator) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { metadata, ...withoutMetadata } = visibleContent;
		visibleContent = withoutMetadata;
	}

	return {
		...rest,
		createdTimestamp: createdTimestamp.toISOString(),
		postUpdate: postUpdate && { id: postUpdate.id, ...postUpdate.metadata },
		content: visibleContent,
	};
};

/**
 * @param {ActivityRow & { children: ActivityRow[] }} row
 * @param {Viewer} viewer
 * @returns {ActivityEntry}
 */
const toEntry = ({ children, ...row }, viewer) => ({
	...toChildEntry(row, viewer),
	children: children.map((child) => toChildEntry(child, viewer)),
});

/**
 * Do not list child activities on their own.
 * @param {ReturnType<import('$lib/utils/activity').getActivityFilters>} filters
 * @param {Viewer} viewer
 */
export const readActivities = async ({ authors, types, cursor, limit }, viewer) => {
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

	return rows.map((row) => toEntry(row, viewer));
};

/**
 * Oldest first.
 * @param {Prisma.Prisma.ActivityWhereInput} where
 * @param {Viewer} viewer
 */
export const readActivitiesWhere = async (where, viewer) => {
	const rows = await prisma.activity.findMany({
		select,
		where: { ...where, parentId: null },
		orderBy: [{ createdTimestamp: 'asc' }, { id: 'asc' }],
	});

	return rows.map((row) => toEntry(row, viewer));
};
