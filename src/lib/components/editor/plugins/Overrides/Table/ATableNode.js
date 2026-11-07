import { $applyNodeReplacement, $getNodeByKey, $isRootNode } from 'lexical';

import { TableNode } from '$lib/lexical/index';

/**
 * @typedef {import('lexical').NodeKey} NodeKey
 * @typedef {import('lexical').SerializedElementNode} SerializedElementNode
 * @typedef {import('lexical').EditorConfig} EditorConfig
 */

export class ATableNode extends TableNode {
	$config() {
		return this.config('a-table', { extends: TableNode });
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

		const tcs = [...dom.querySelectorAll('td'), ...dom.querySelectorAll('th')];

		tcs.forEach((tc) => {
			tc.style.width = '';
			tc.style.removeProperty('width');
			tc.style.minWidth = '';
			tc.style.removeProperty('min-width');
		});

		const col = [...dom.querySelectorAll('col')];

		col.forEach((c) => {
			c.style.width = `${parseInt(c.style.width)}%`;
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
