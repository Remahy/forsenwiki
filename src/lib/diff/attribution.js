/**
 * @typedef {import('$lib/lexical/diff/helpers').Author} Author
 * @typedef {{ blocks: Array<[id: string | null, hash: string]>, by: string, at: number }} AttributableVersion
 */

/**
 * @param {AttributableVersion[]} versions Oldest first. The oldest one's author is not counted.
 * @returns {{ blocks: Record<string, Author>, removed: Record<string, Author> }}
 */
export const attributeBlocks = (versions) => {
	/** @type {Record<string, Author>} */
	const blocks = {};
	/** @type {Record<string, Author>} */
	const removed = {};

	const identified = (/** @type {AttributableVersion} */ version) =>
		new Map(/** @type {Array<[string, string]>} */ (version.blocks.filter(([id]) => id !== null)));

	let previous = identified(versions[0]);

	for (const version of versions.slice(1)) {
		const { by, at } = version;
		const current = identified(version);

		for (const [id, hash] of current) {
			if (previous.get(id) !== hash) {
				blocks[id] = { by, at };
				delete removed[id];
			}
		}

		for (const id of previous.keys()) {
			if (!current.has(id)) {
				removed[id] = { by, at };
			}
		}

		previous = current;
	}

	return { blocks, removed };
};
