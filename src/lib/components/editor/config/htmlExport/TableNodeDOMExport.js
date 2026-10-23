import { ATableNode } from '$lib/lexical/custom';
import { $isRootNode as isRootNode, $getNodeByKey as getNodeByKey } from 'lexical';

/**
 * @type {[import("lexical").Klass<LexicalNode>, (editor: LexicalEditor, target: LexicalNode) => import("lexical").DOMExportOutput]}
 */
export default [
	ATableNode,
	(editor, node) => {
		const output = node.exportDOM(editor);

		return {
			...output,
			after: (generatedElement) => {
				const parentIsRoot = editor.read(() => {
					const n = getNodeByKey(node.getKey());
					const parent = n?.getParent();
					if (!parent) {
						return false;
					}

					return isRootNode(parent);
				});

				const table = output.after ? output.after(generatedElement) : generatedElement;

				const clonedTable = /** @type {HTMLElement} */ (table?.cloneNode(true));

				const tcs = [...clonedTable.querySelectorAll('td'), ...clonedTable.querySelectorAll('th')];

				tcs.forEach((td) => {
					td.style.removeProperty('width');
					td.style.removeProperty('min-width');
				});

				const col = [...clonedTable.querySelectorAll('col')];

				col.forEach((c) => {
					c.style.width = `${parseInt(c.style.width)}%`;
				});

				if (!parentIsRoot) {
					return clonedTable;
				}

				/**
				 * <div class="overflow-x-auto">
				 * 	<div class="inline-block min-w-full align-middle">
				 * 		<div class="overflow-hidden">
				 * 			<table></table>
				 * 		</div>
				 * 	</div>
				 * </div>
				 */

				const wrapper = document.createElement('div');
				wrapper.classList.add('overflow-x-auto');
				const wrapper2 = document.createElement('div');
				wrapper2.classList.add('inline-block', 'min-w-full', 'align-middle');
				const wrapper3 = document.createElement('div');
				wrapper3.classList.add('overflow-hidden');

				wrapper3.append(clonedTable);

				wrapper2.append(wrapper3);
				wrapper.append(wrapper2);

				return wrapper;
			},
		};
	},
];
