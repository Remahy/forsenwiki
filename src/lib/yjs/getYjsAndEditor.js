// Realistically only used by backend.
import { createHeadlessEditor } from '@lexical/headless';
import { createBinding, syncLexicalUpdateToYjs, syncYjsChangesToLexical } from '@lexical/yjs';

import { applyDiffToYDoc, convertUpdateFormatV2ToV1, createNewYDoc } from './utils';

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
 * @param {import('@lexical/yjs').Provider} provider
 * @param {import('@lexical/yjs').Binding} binding
 */
function registerCollaborationListeners(provider, binding) {
	// this syncs yjs changes to the lexical editor
	/** @param {import('yjs').YEvent<any>[]} events @param {import('yjs').Transaction} transaction */
	const onYjsTreeChanges = (events, transaction) => {
		if (transaction.origin !== binding) {
			syncYjsChangesToLexical(binding, provider, events, false);
		}
	};

	binding.root.getSharedType().observeDeep(onYjsTreeChanges);
}

/**
 * @param {any} config
 * @param {Uint8Array} update
 * @returns {{editor: LexicalEditor, doc: YDoc}}
 */
export function getYjsAndEditor(config, update) {
	const editor = createHeadlessEditor(config);

	const dummyId = 'dummy-id';
	const doc = createNewYDoc();
	const docMap = new Map([[dummyId, doc]]);
	const provider = createNoOpProvider();
	const binding = createBinding(editor, provider, dummyId, doc, docMap);

	registerCollaborationListeners(provider, binding);

	const convertedUpdate = convertUpdateFormatV2ToV1(update);

	// copy the original document to the copy to trigger the observer which updates the editor
	applyDiffToYDoc(doc, convertedUpdate, { isUpdateRemote: true });

	editor.update(() => {}, { discrete: true });

	// Enables Y.Doc to be updated when Lexical changes happen.
	editor.registerUpdateListener(
		({ dirtyElements, dirtyLeaves, editorState, normalizedNodes, prevEditorState, tags }) => {
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

	return { editor, doc };
}
