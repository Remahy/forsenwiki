<script module>
	/**
	 * @typedef {Readonly<import('./FloatBlock').FloatBlockNodePayload>} FloatBlockNodePayload
	 */

	/** @type {import('lexical').LexicalCommand<FloatBlockNodePayload>} */
	export const INSERT_FLOATBLOCK_COMMAND = createCommand();
</script>

<script>
	import {
		createCommand,
		$createParagraphNode as createParagraphNode,
		COMMAND_PRIORITY_EDITOR,
		$isTextNode as isTextNode,
		$createTextNode as createTextNode,
		KEY_ARROW_LEFT_COMMAND,
		COMMAND_PRIORITY_NORMAL,
		$getSelection as getSelection,
		KEY_ARROW_RIGHT_COMMAND,
	} from 'lexical';
	import {
		$insertNodeToNearestRoot as insertNodeToNearestRoot,
		mergeRegister,
	} from '@lexical/utils';
	import { getEditor } from 'svelte-lexical';

	import {
		$isFloatBlockNode as isFloatBlockNode,
		$createFloatBlockNode as createFloatBlockNode,
		FloatBlockNode,
	} from './FloatBlock';

	/**
	 * @typedef {import('lexical').PointType} PointType
	 */

	/** @type {import('lexical').LexicalEditor} */
	const editor = getEditor();

	/** @param {FloatBlockNodePayload} payload */
	const wrapperInsertFloatBlock = ({ float, width, height }) => {
		editor.update(() => {
			const floatBlockNode = createFloatBlockNode({ float, width, height });

			insertNodeToNearestRoot(floatBlockNode);

			floatBlockNode.append(createParagraphNode().append(createTextNode()));

			const firstDescendant = floatBlockNode.getFirstDescendant();

			if (isTextNode(firstDescendant)) {
				firstDescendant.select();
			}
		});
	};

	/**
	 * @param {boolean} atBefore
	 * @param {number} o
	 * @param {number} textLength
	 */
	const offsetIsAtEdges = (atBefore, o, textLength) => (atBefore ? o === 0 : o === textLength);

	/**
	 * @param {boolean} atBefore
	 * @param {ElementNode} node
	 * @param {LexicalNode} nodeToInsert
	 */
	const insertFnc = (atBefore, node, nodeToInsert) =>
		atBefore ? node.insertBefore(nodeToInsert) : node.insertAfter(nodeToInsert);

	/**
	 * @param {boolean} atBefore
	 * @param {ElementNode} node
	 */
	const hasAdjacentNode = (atBefore, node) =>
		atBefore ? node.getPreviousSibling() : node.getNextSibling();

	const INSERT_BEFORE = true;
	const INSERT_AFTER = false;

	const insertParagraph = (atBefore = INSERT_BEFORE) => {
		return editor.read(() => {
			const selection = getSelection();
			if (!selection?.isCollapsed()) {
				return false;
			}

			const [anchor] = /** @type {[PointType, PointType]} */ (selection.getStartEndPoints());

			const anchorNode = anchor.getNode();

			if (
				isFloatBlockNode(anchorNode) &&
				offsetIsAtEdges(atBefore, anchor.offset, anchorNode.getTextContentSize()) &&
				!hasAdjacentNode(atBefore, anchorNode)
			) {
				editor.update(() => {
					const newNode = createParagraphNode().append(createTextNode());
					insertFnc(atBefore, anchorNode, newNode);
				});

				return true;
			}

			if (
				isTextNode(anchorNode) &&
				offsetIsAtEdges(atBefore, anchor.offset, anchorNode.getTextContentSize())
			) {
				const parentParentNode = anchorNode.getParent()?.getParent();

				if (!isFloatBlockNode(parentParentNode)) {
					return false;
				}

				if (!hasAdjacentNode(atBefore, parentParentNode)) {
					editor.update(() => {
						const newNode = createParagraphNode().append(createTextNode());
						insertFnc(atBefore, parentParentNode, newNode);
					});

					return true;
				}
			}

			return false;
		});
	};

	$effect(() => {
		if (!editor.hasNodes([FloatBlockNode])) {
			throw new Error('FloatNodePlugin: FloatBlockNode not registered on editor');
		}

		return mergeRegister(
			editor.registerNodeTransform(FloatBlockNode, (node) => {
				const children = node.getChildren();

				if (!children.length) {
					node.remove();
				}
			}),
			editor.registerCommand(
				INSERT_FLOATBLOCK_COMMAND,
				(payload) => {
					wrapperInsertFloatBlock(payload);
					return true;
				},
				COMMAND_PRIORITY_EDITOR
			),
			editor.registerCommand(
				KEY_ARROW_LEFT_COMMAND,
				(payload) => {
					if (payload.ctrlKey) {
						return false;
					}

					return insertParagraph(INSERT_BEFORE);
				},
				COMMAND_PRIORITY_NORMAL
			),
			editor.registerCommand(
				KEY_ARROW_RIGHT_COMMAND,
				(payload) => {
					if (payload.ctrlKey) {
						return false;
					}

					return insertParagraph(INSERT_AFTER);
				},
				COMMAND_PRIORITY_NORMAL
			)
		);
	});
</script>
