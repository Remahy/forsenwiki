// Realistically only used by backend.
import { createHeadlessEditor } from '@lexical/headless';
import { createBinding, syncLexicalUpdateToYjs, syncYjsChangesToLexical } from '@lexical/yjs';

import { applyDiffToYDoc, convertUpdateFormatV2ToV1, createNewYDoc, UndoManager } from './utils';

// https://lexical.dev/docs/collaboration/faq#initializing-editorstate-from-yjs-document

/** @returns {import('@lexical/yjs').Provider} */
function createNoOpProvider() {
	const emptyFunction = () => {};

	return {
		awareness: {
			getLocalState: () => null,
			getStates: () => new Map(),
			off: emptyFunction,
			on: emptyFunction,
			setLocalState: emptyFunction,
			setLocalStateField: emptyFunction,
		},
		connect: emptyFunction,
		disconnect: emptyFunction,
		off: emptyFunction,
		on: emptyFunction,
	};
}

/**
 * @param {LexicalEditor} editor
 * @param {import('@lexical/yjs').Provider} provider
 * @param {import('@lexical/yjs').Binding} binding
 */
function registerCollaborationListeners(editor, provider, binding) {
	// this syncs yjs changes to the lexical editor
	/** @param {import('yjs').YEvent<any>[]} events @param {import('yjs').Transaction} transaction */
	const onYjsTreeChanges = (events, transaction) => {
		if (transaction.origin !== binding) {
			const isFromUndoManger = transaction.origin instanceof UndoManager;
			syncYjsChangesToLexical(binding, provider, events, isFromUndoManger);
		}
	};

	binding.root.getSharedType().observeDeep(onYjsTreeChanges);

	// Enables Y.Doc to be updated when Lexical changes happen.
	editor.registerUpdateListener(
		({ prevEditorState, editorState, dirtyElements, dirtyLeaves, normalizedNodes, tags }) => {
			if (tags.has('skip-collab') === false) {
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
	);
}

/**
 * @param {any} config
 */
function withHeadlessEditor(config) {
	const editor = createHeadlessEditor(config);

	const dummyId = 'dummy-id';
	const doc = createNewYDoc();
	const docMap = new Map([[dummyId, doc]]);
	const provider = createNoOpProvider();

	const binding = createBinding(editor, provider, dummyId, doc, docMap);

	registerCollaborationListeners(editor, provider, binding);

	return { editor, doc, binding };
}

/**
 * @param {any} config
 * @param {Uint8Array} updateV2
 */
export function getYjsAndEditor(config, updateV2) {
	const { editor, doc, binding } = withHeadlessEditor(config);

	const convertedUpdate = convertUpdateFormatV2ToV1(updateV2);

	applyDiffToYDoc(doc, convertedUpdate, { isUpdateRemote: true });
	editor.update(() => {}, { discrete: true });

	return { editor, doc, binding };
}
