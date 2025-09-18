import { TableNode } from '$lib/lexical/index';
import { $getNodeByKey as getNodeByKey } from 'lexical';

/**
 * @type {[import("lexical").Klass<LexicalNode>, (editor: LexicalEditor, target: LexicalNode) => import("lexical").DOMExportOutput]}
 */
export default [
	TableNode,
	(editor, node) => {
		const output = node.exportDOM(editor);

		return {
			...output,
			after: (generatedElement) => {
				const nesting = editor.read(() => getNodeByKey(node.getKey()))?.getParent()?.__type === 'root';

				const table = output.after ? output.after(generatedElement) : generatedElement;

				if (!nesting) {
					return table;
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

				// @ts-ignore
				const clonedTable = table.cloneNode(true);

				// @ts-ignore
				const tds = [...clonedTable.querySelectorAll('td')];

				tds.forEach((td) => {
					td.style.width = undefined;
					td.style.minWidth = '75px';

				});

				wrapper3.append(clonedTable);

				wrapper2.append(wrapper3);
				wrapper.append(wrapper2);

				return wrapper;
			},
		};
	},
];
