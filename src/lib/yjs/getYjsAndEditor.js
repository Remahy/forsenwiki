// Realistically only used by backend.
import { createHeadlessEditor } from '@lexical/headless';
import { createBinding, syncLexicalUpdateToYjs, syncYjsChangesToLexical } from '@lexical/yjs';

import { applyDiffToYDocV2, createNewYDoc } from './utils';

// https://lexical.dev/docs/collaboration/faq#initializing-editorstate-from-yjs-document

/** @returns {import('@lexical/yjs').Provider} */
function createNoOpProvider()  {
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
 * 
 * @param {LexicalEditor} editor 
 * @param {import('@lexical/yjs').Provider} provider 
 * @param {import('@lexical/yjs').Binding} binding 
 */
function registerCollaborationListeners(
  editor,
  provider,
  binding,
) {
  const unsubscribeUpdateListener = editor.registerUpdateListener(
    ({
      dirtyElements,
      dirtyLeaves,
      editorState,
      normalizedNodes,
      prevEditorState,
      tags,
    }) => {
      if (tags.has('skip-collab') === false) {
        syncLexicalUpdateToYjs(
          binding,
          provider,
          prevEditorState,
          editorState,
          dirtyElements,
          dirtyLeaves,
          normalizedNodes,
          tags,
        );
      }
    },
  );

	/** @param {import('yjs').YEvent<any>[]} events @param {import('yjs').Transaction} transaction */
  const observer = (events, transaction) => {
    if (transaction.origin !== binding) {
      syncYjsChangesToLexical(binding, provider, events, false);
    }
  };

  binding.root.getSharedType().observeDeep(observer);

  return () => {
    unsubscribeUpdateListener();
    binding.root.getSharedType().unobserveDeep(observer);
  };
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
	const binding = createBinding(
		editor,
		provider,
		dummyId,
		doc,
		docMap
	);

  const unsubscribe = registerCollaborationListeners(editor, provider, binding);

	// copy the original document to the copy to trigger the observer which updates the editor
	applyDiffToYDocV2(doc, update, { isUpdateRemote: true });
	editor.update(() => {}, { discrete: true });

	unsubscribe();

	return { editor, doc };
}
