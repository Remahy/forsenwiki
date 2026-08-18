import {
	$isRangeSelection as isRangeSelection,
	$isRootOrShadowRoot as isRootOrShadowRoot,
	$createParagraphNode as createParagraphNode,
	$getSelection as getSelection,
	$isParagraphNode as isParagraphNode,
	$isTextNode as isTextNode,
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

		const hasParagraphNodeParent =
			nodeAtSelection.getParents().find((n) => isParagraphNode(n)) ||
			isParagraphNode(nodeAtSelection);

		if (hasParagraphNodeParent) {
			return;
		}

		const node = createParagraphNode();

		const rangeSelection = isRangeSelection(selection);

		if (rangeSelection) {
			const initialNode = selection.anchor.getNode();
			const isLeaf = isTextNode(initialNode);

			let isAtStart = false;
			let isAtEnd = true;

			if (isLeaf) {
				const parent = initialNode.getParent();
				isAtStart = selection.anchor.offset === 0 && parent?.getFirstChild() === initialNode;
				isAtEnd = parent?.getLastChild() === initialNode;
				initialNode.getParent()?.select();
			}

			const selectionNode = selection.anchor.getNode();

			const previousSibling = selectionNode.getPreviousSibling();
			if (isAtStart && previousSibling) {
				previousSibling.selectEnd();
				insertNodeToNearestRoot(node).selectStart();
				return;
			} else if (!previousSibling && isAtStart) {
				selectionNode.insertBefore(node);
				node.selectStart();
				return;
			}

			if (isAtEnd) {
				selectionNode.insertAfter(node);
				node.selectStart();
				return;
			}
		}

		insertNodeToNearestRoot(node).selectStart();
	});
