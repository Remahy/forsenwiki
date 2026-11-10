import { $createHeadingNode } from '@lexical/rich-text';
import { HeadingNode } from '$lib/lexical/index';

export class AHeadingNode extends HeadingNode {
	$config() {
		return this.config('a-heading', { extends: HeadingNode });
	}

	/**
	 * @param {import("@lexical/rich-text").SerializedHeadingNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createHeadingNode().updateFromJSON(serializedNode);
		return node;
	}
}
