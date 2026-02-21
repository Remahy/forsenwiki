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
		$isTextNode as isTextNode,
		$createTextNode as createTextNode,
		$getSelection as getSelection,
		COMMAND_PRIORITY_EDITOR,
		COMMAND_PRIORITY_NORMAL,
		KEY_ARROW_LEFT_COMMAND,
		KEY_ARROW_RIGHT_COMMAND,
	} from 'lexical';
	import {
		$insertNodeToNearestRoot as insertNodeToNearestRoot,
		mergeRegister,
	} from '@lexical/utils';
	import { getEditor } from 'svelte-lexical';
	import { $isAtNodeEnd as isAtNodeEnd } from '@lexical/selection';

	import { hasAdjacentNode, insertFnc } from '../../utils/insertUtils';
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
	const wrapperInsertFloatBlock = ({ float, width, height, hasBorder }) => {
		editor.update(() => {
			const floatBlockNode = createFloatBlockNode({ float, width, height, hasBorder });

			insertNodeToNearestRoot(floatBlockNode);

			floatBlockNode.append(createParagraphNode().append(createTextNode()));

			const firstDescendant = floatBlockNode.getFirstDescendant();

			if (isTextNode(firstDescendant)) {
				firstDescendant.select();
			}
		});
	};

	const INSERT_BEFORE = true;
	const INSERT_AFTER = false;

	const insertParagraph = (atBefore = INSERT_BEFORE) => {
		return editor.read(() => {
			const selection = getSelection();
			if (!selection?.isCollapsed()) {
				return false;
			}

			const [anchor, focus] = /** @type {[PointType, PointType]} */ (selection.getStartEndPoints());
			const anchorNode = anchor.getNode();

			const floatBlockParent = anchorNode.getParents().find((n) => isFloatBlockNode(n));

			if (!floatBlockParent) {
				return false;
			}

			let isAtStart;
			let isAtEnd;
			if (isTextNode(anchorNode)) {
				const allTextNodes = floatBlockParent.getAllTextNodes();

				isAtStart = anchor.offset === 0 && allTextNodes[0] === anchorNode;
				isAtEnd = isAtNodeEnd(focus) && allTextNodes[allTextNodes.length - 1] === anchorNode;
			} else {
				isAtStart = anchor.offset === 0 && floatBlockParent.getFirstChild() === anchorNode;
				isAtEnd = isAtNodeEnd(focus) && floatBlockParent.getLastChild() === anchorNode;
			}

			const isAtEdge = isAtStart || isAtEnd;

			const adjacentNode = hasAdjacentNode(atBefore, floatBlockParent);

			if (!isAtEdge || adjacentNode) {
				return false;
			}

			editor.update(() => {
				const newNode = createParagraphNode().append(createTextNode());
				const n = insertFnc(atBefore, floatBlockParent, newNode);

				n.selectStart();
			});

			return true;
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
