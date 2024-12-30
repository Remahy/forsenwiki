import { VideoEmbedNode } from '$lib/lexical/custom';
import { addInformationHover, applyCSSColorDiff } from './utils';

/**
 * @typedef {import("lexical").NodeKey} NodeKey
 * @typedef {import("lexical").LexicalEditor} LexicalEditor
 * @typedef {import("lexical").EditorConfig} EditorConfig
 */

export class DiffVideoEmbedNode extends VideoEmbedNode {
	/** @type {import('./Types').___Change} */
	___change;

	/**
	 * @param {VideoEmbedNode} node
	 * @param {NodeKey} [key]
	 */
	constructor(node, key) {
		super(node.__platform, node.__src, node.__width, node.__height, node.__format, key);

		this.setFormat(node.__format);
		this.setPlatform(node.getPlatform());
		this.setSrc(node.getSrc());
		this.setWidthAndHeight(node.getWidthAndHeight());

		// @ts-ignore
		this.___change = node.___change;
	}

	/**
	 * @param {DiffVideoEmbedNode} node
	 */
	static clone(node) {
		return new DiffVideoEmbedNode(node, node.__key);
	}

	static getType() {
		return 'diff-videoembed';
	}

	/**
	 * @param {import('../VideoEmbed/VideoEmbed').SerializedVideoEmbedNode} serializedNode
	 */
	static importJSON(serializedNode) {
		const VideoEmbed = VideoEmbedNode.importJSON(serializedNode);

		// @ts-ignore
		VideoEmbed.___change = serializedNode.___change;

		const node = new DiffVideoEmbedNode(VideoEmbed);
		return node;
	}

	exportDOM() {
		const dom = super.exportDOM();

		if (
			dom.element instanceof HTMLElement &&
			Object.prototype.hasOwnProperty.call(this.___change, '___type')
		) {
			const div = document.createElement('div');
			div.classList.add('py-4', 'pl-4', 'pr-7');
			div.appendChild(dom.element);

			applyCSSColorDiff(div, this.___change.___type);

			addInformationHover(div, this.___change);

			// We need to wrap ImageNode in a span to make sure 'relative' class works properly.
			dom.element = div;
		}

		return dom;
	}

	exportJSON() {
		return { ...super.exportJSON(), type: this.getType() };
	}

	/**
	 * @param {LexicalEditor} editor
	 * @param {EditorConfig} config
	 */
	decorate(editor, config) {
		return super.decorate(editor, config);
	}
}

// /**
//  * @param {VideoEmbedNode} node
//  */
// export function $createDiffVideoEmbedNode(node) {
// 	return new DiffVideoEmbedNode(node);
// }
