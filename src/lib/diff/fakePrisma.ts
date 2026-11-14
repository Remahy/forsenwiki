export type StateRow = {
	postUpdateId: string;
	madeBy: string;
	content: Uint8Array;
	createdTimestamp?: Date;
};
export type PageRow = {
	olderId: string;
	newerId: string;
	page: number;
	madeBy: string;
	content: Uint8Array;
	createdTimestamp?: Date;
};

type Where = {
	olderId?: string;
	newerId?: string;
	madeBy?: { not: string };
	createdTimestamp?: { lt: Date };
};

const matches = (row: StateRow | PageRow, where: Where) =>
	(where.olderId === undefined || ('olderId' in row && row.olderId === where.olderId)) &&
	(where.newerId === undefined || ('newerId' in row && row.newerId === where.newerId)) &&
	(where.madeBy === undefined || row.madeBy !== where.madeBy.not) &&
	(where.createdTimestamp === undefined ||
		(row.createdTimestamp as Date) < where.createdTimestamp.lt);

const deleteMany =
	<T extends StateRow | PageRow>(rows: Map<string, T>) =>
	async ({ where }: { where: Where }) => {
		let count = 0;

		for (const [key, row] of rows) {
			if (matches(row, where)) {
				rows.delete(key);
				count++;
			}
		}

		return { count };
	};

const pageKey = ({ olderId, newerId, page }: Pick<PageRow, 'olderId' | 'newerId' | 'page'>) =>
	`${olderId}:${newerId}:${page}`;

/**
 * Stands in for the two cache tables. The rows are given, so that they outlast a reset of the modules.
 */
export const fakePrisma = ({
	stateRows,
	pageRows,
}: {
	stateRows: Map<string, StateRow>;
	pageRows: Map<string, PageRow>;
}) => ({
	yPostUpdateStateCache: {
		findUnique: async ({ where }: { where: { postUpdateId: string } }) =>
			stateRows.get(where.postUpdateId) ?? null,
		upsert: async ({ create }: { create: StateRow }) => {
			stateRows.set(create.postUpdateId, { ...create, createdTimestamp: new Date() });
		},
		deleteMany: deleteMany(stateRows),
	},
	yPostDiffPageCache: {
		findUnique: async ({ where }: { where: { olderId_newerId_page: PageRow } }) =>
			pageRows.get(pageKey(where.olderId_newerId_page)) ?? null,
		deleteMany: deleteMany(pageRows),
		createMany: async ({ data }: { data: PageRow[] }) => {
			for (const row of data) {
				pageRows.set(pageKey(row), { ...row, createdTimestamp: new Date() });
			}
		},
	},
	$transaction: (operations: Promise<unknown>[]) => Promise.all(operations),
});
