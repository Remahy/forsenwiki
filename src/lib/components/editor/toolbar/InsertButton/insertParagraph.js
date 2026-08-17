import {
	$insertNodes as insertNodes,
	$createParagraphNode as createParagraphNode,
	$getSelection as getSelection,
	$isParagraphNode as isParagraphNode,
} from 'lexical';
import { $insertNodeToNearestRoot as insertNodeToNearestRoot } from '@lexical/utils';

/**
 * @param {LexicalEditor} editor
 */
export const insertParagraph = (editor) =>
	editor.update(() => {
		const selection = getSelection();

		const [nodeAtSelection] = selection?.getNodes() || [];

		if (!nodeAtSelection) {
			return;
		}

		const hasParagraphNodeParent = nodeAtSelection.getParents().find((n) => isParagraphNode(n));

		if (hasParagraphNodeParent) {
			return;
		}

		const node = createParagraphNode();

		insertNodeToNearestRoot(node);

		node.selectStart();
	});
