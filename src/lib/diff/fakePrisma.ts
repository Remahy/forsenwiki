export type StateRow = { postUpdateId: string; madeBy: string; content: Uint8Array };
export type PageRow = {
	olderId: string;
	newerId: string;
	page: number;
	madeBy: string;
	content: Uint8Array;
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
			stateRows.set(create.postUpdateId, create);
		},
	},
	yPostDiffPageCache: {
		findUnique: async ({ where }: { where: { olderId_newerId_page: PageRow } }) =>
			pageRows.get(pageKey(where.olderId_newerId_page)) ?? null,
		deleteMany: async ({ where }: { where: { olderId: string; newerId: string } }) => {
			for (const [key, row] of pageRows) {
				if (row.olderId === where.olderId && row.newerId === where.newerId) {
					pageRows.delete(key);
				}
			}
		},
		createMany: async ({ data }: { data: PageRow[] }) => {
			for (const row of data) {
				pageRows.set(pageKey(row), row);
			}
		},
	},
	$transaction: (operations: Promise<unknown>[]) => Promise.all(operations),
});
