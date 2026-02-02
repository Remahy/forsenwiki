import { $applyNodeReplacement, $getNodeByKey, $isRootNode } from 'lexical';

import { TableNode } from '$lib/lexical/index';
/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').SerializedElementNode} SerializedElementNode
 * @typedef {import('lexical').EditorConfig} EditorConfig
 */

export class ATableNode extends TableNode {
	/**
	 * @param {NodeKey} [key]
	 */
	constructor(key) {
		super(key);
	}

	$config() {
		return this.config('table', { extends: TableNode });
	}

	static getType() {
		return 'table';
	}

	/**
	 * @param {ATableNode} node
	 */
	static clone(node) {
		return new ATableNode(node.__key);
	}

	/** @param {import('@lexical/table').SerializedTableNode} serializedNode */
	static importJSON(serializedNode) {
		const node = $createATableNode().updateFromJSON(serializedNode);

		return node;
	}

	/**
	 * @param {EditorConfig} config
	 * @param {LexicalEditor} editor
	 */
	createDOM(config, editor) {
		const dom = super.createDOM(config, editor);

		const parentIsRoot = editor.read(() => {
			const n = $getNodeByKey(this.getKey());
			const parent = n?.getParent();
			if (!parent) {
				return false;
			}

			return $isRootNode(parent);
		});

		if (!parentIsRoot) {
			return dom;
		}

		const wrapper = document.createElement('div');
		wrapper.classList.add('overflow-x-auto');
		const wrapper2 = document.createElement('div');
		wrapper2.classList.add('inline-block', 'min-w-full', 'align-middle');
		const wrapper3 = document.createElement('div');
		wrapper3.classList.add('overflow-hidden');

		wrapper3.append(dom);

		wrapper2.append(wrapper3);
		wrapper.append(wrapper2);

		return wrapper;
	}

	exportJSON() {
		return {
			...super.exportJSON(),
			type: ATableNode.getType(),
		};
	}
}

/**
 * @param {NodeKey} [key]
 */
export function $createATableNode(key) {
	return $applyNodeReplacement(new ATableNode(key));
}

/**
 * @param {any} node
 * @returns {node is ATableNode}
 */
export function $isATableNode(node) {
	return node instanceof ATableNode;
}
