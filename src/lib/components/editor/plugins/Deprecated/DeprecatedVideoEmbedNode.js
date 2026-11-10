import { $applyNodeReplacement } from 'lexical';
import { FallbackNode } from '../Fallback/Fallback';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').ElementFormatType} ElementFormatType
 */

// Example of how to still support deprecated nodes.
// The original node is kept as JSON in `__data`, so it can be migrated later.

export class DeprecatedVideoEmbedNode extends FallbackNode {
	static getType() {
		return 'youtube';
	}

	/**
	 * @param {DeprecatedVideoEmbedNode} node
	 */
	static clone(node) {
		return new DeprecatedVideoEmbedNode(node.__data, node.getFormatType(), node.__key);
	}

	/**
	 * @param {import('../Fallback/Fallback').SerializedFallbackNode} serializedNode
	 */
	static importJSON(serializedNode) {
		return $createDeprecatedVideoEmbedNode().updateFromJSON(serializedNode);
	}

	// TODO: Implement migration of deprecated node to new node.
}

/**
 * @param {string} [data]
 * @param {ElementFormatType} [format]
 * @param {NodeKey} [key]
 */
export function $createDeprecatedVideoEmbedNode(data, format, key) {
	return $applyNodeReplacement(new DeprecatedVideoEmbedNode(data, format, key));
}
