import { $createFallbackNode, FallbackNode } from '../Fallback/Fallback';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').LexicalEditor} LexicalEditor
 * @typedef {import('lexical').ElementFormatType} ElementFormatType
 * @typedef {import('../VideoEmbed/VideoEmbed').SupportedPlatforms} SupportedPlatforms
 */

// Example of how to still support deprecated nodes.

export class DeprecatedVideoEmbedNode extends FallbackNode {
	/**
	 * @param {SupportedPlatforms} platform
	 * @param {string} src
	 * @param {number | 'inherit'} width
	 * @param {number | 'inherit'} height
	 * @param {ElementFormatType} [format]
	 * @param {NodeKey} [key]
	 */
	constructor(platform, src, width, height, format, key) {
		super({
			format,
			key,
			data: JSON.stringify({
				type: DeprecatedVideoEmbedNode.getType(),
				platform,
				src,
				width,
				height,
			}),
		});
	}

	static getType() {
		return 'youtube';
	}

	/**
	 * @param {any} node
	 */
	static clone(node) {
		return new DeprecatedVideoEmbedNode(
			node.__platform,
			node.__src,
			node.__width,
			node.__height,
			node.__format,
			node.__key
		);
	}

	/**
	 * @param {any} serializedNode
	 */
	static importJSON(serializedNode) {
		const node = $createFallbackNode().updateFromJSON(serializedNode);
		node.__type = DeprecatedVideoEmbedNode.getType();
		return node;
	}

	/**
	 * @param {LexicalEditor} editor
	 */
	decorate(editor) {
		return super.decorate(editor);
	}

	exportJSON() {
		return { ...super.exportJSON(), type: DeprecatedVideoEmbedNode.getType() };
	}

	// TODO: Implement migration of deprecated node to new node.
}
