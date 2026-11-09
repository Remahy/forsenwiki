import { mergeRegister } from '@lexical/utils';
import {
	createUndoManager,
	createYjsBinding,
	syncLexicalUpdateToYjs,
	syncYjsChangesToLexical,
} from '@lexical/yjs';
import {
	CAN_REDO_COMMAND,
	CAN_UNDO_COMMAND,
	COMMAND_PRIORITY_EDITOR,
	REDO_COMMAND,
	SKIP_COLLAB_TAG,
	UNDO_COMMAND,
} from 'lexical';
import { UndoManager } from 'yjs';

/**
 * @lexical/react's CollaborationPlugin without cursors, awareness or bootstrapping, which our IndexedDB provider doesn't use.
 * @param {LexicalEditor} editor
 * @param {{ id: string, provider: import('@lexical/yjs').Provider, docMap: Map<string, YDoc> }} options
 * @returns {() => void}
 */
export function registerCollaboration(editor, { id, provider, docMap }) {
	const doc = /** @type {YDoc} */ (docMap.get(id));
	const binding = createYjsBinding({ editor, id, doc, docMap });
	const sharedType = binding.root.getSharedType();
	const undoManager = createUndoManager(binding, sharedType);

	/** @param {import('yjs').YEvent<any>[]} events @param {import('yjs').Transaction} transaction */
	const onYjsTreeChanges = (events, transaction) => {
		const { origin } = transaction;

		if (origin !== binding) {
			syncYjsChangesToLexical(binding, provider, events, origin instanceof UndoManager);
		}
	};

	const updateUndoRedoStates = () => {
		editor.dispatchCommand(CAN_UNDO_COMMAND, undoManager.undoStack.length > 0);
		editor.dispatchCommand(CAN_REDO_COMMAND, undoManager.redoStack.length > 0);
	};

	sharedType.observeDeep(onYjsTreeChanges);
	undoManager.on('stack-item-added', updateUndoRedoStates);
	undoManager.on('stack-item-popped', updateUndoRedoStates);
	undoManager.on('stack-cleared', updateUndoRedoStates);

	const unregister = mergeRegister(
		editor.registerUpdateListener(
			({ prevEditorState, editorState, dirtyLeaves, dirtyElements, normalizedNodes, tags }) => {
				if (!tags.has(SKIP_COLLAB_TAG)) {
					syncLexicalUpdateToYjs(
						binding,
						provider,
						prevEditorState,
						editorState,
						dirtyElements,
						dirtyLeaves,
						normalizedNodes,
						tags
					);
				}
			}
		),
		editor.registerCommand(
			UNDO_COMMAND,
			() => {
				undoManager.undo();
				return true;
			},
			COMMAND_PRIORITY_EDITOR
		),
		editor.registerCommand(
			REDO_COMMAND,
			() => {
				undoManager.redo();
				return true;
			},
			COMMAND_PRIORITY_EDITOR
		)
	);

	provider.connect();

	return () => {
		unregister();
		sharedType.unobserveDeep(onYjsTreeChanges);
		undoManager.destroy();
		provider.disconnect();
		binding.root.destroy(binding);
	};
}
