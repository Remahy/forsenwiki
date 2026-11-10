import { $createTableCellNode } from '@lexical/table';
import { TableCellNode } from '$lib/lexical/index';

export class ATableCellNode extends TableCellNode {
	$config() {
		return this.config('a-tablecell', { extends: TableCellNode });
	}

	/**
	 * @param {import("@lexical/table").SerializedTableCellNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createTableCellNode().updateFromJSON(serializedNode);

		return node;
	}
}
