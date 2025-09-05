// Realistically only used by backend.
import { createHeadlessEditor } from '@lexical/headless';
import { createBinding, syncLexicalUpdateToYjs, syncYjsChangesToLexical } from '@lexical/yjs';

import { applyDiffToYDoc, createNewYDoc } from './utils';

// https://github.com/facebook/lexical/discussions/4442

/**
 * @param {any} config
 * @param {Uint8Array} update
 * @returns {{editor: LexicalEditor, doc: YDoc}}
 */
export function getYjsAndEditor(config, update) {
	const editor = createHeadlessEditor(config);

	const dummyId = 'dummy-id';
	/** @type {import('@lexical/yjs').Provider} */
	const dummyProvider = {
		awareness: {
			setLocalState: () => {},
			// @ts-ignore
			getStates: () => [],
			getLocalState: () => null,
			on: () => {},
			off: () => {},
		},
	};
	const copyTarget = createNewYDoc();
	const copyBinding = createBinding(
		editor,
		dummyProvider,
		dummyId,
		copyTarget,
		new Map([[dummyId, copyTarget]])
	);

	// this syncs yjs changes to the lexical editor
	/** @param {import('yjs').YEvent<any>[]} events */
	const onYjsTreeChanges = (events) => {
		syncYjsChangesToLexical(copyBinding, dummyProvider, events, false);
	};
	copyBinding.root.getSharedType().observeDeep(onYjsTreeChanges);

	// copy the original document to the copy to trigger the observer which updates the editor
	applyDiffToYDoc(copyTarget, update);

	editor.update(() => {}, { discrete: true });

	// Enables "copyTarget"/Y.Doc to be updated when Lexical changes happen.
	editor.registerUpdateListener(
		({ dirtyElements, dirtyLeaves, editorState, normalizedNodes, prevEditorState, tags }) => {
			if (tags.has('skip-collab') === false) {
				syncLexicalUpdateToYjs(
					copyBinding,
					dummyProvider,
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

	return { editor, doc: copyTarget };
}
