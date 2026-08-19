import {
	CLEAR_DIFF_VERSIONS_COMMAND__EXPERIMENTAL,
	CONNECTED_COMMAND,
	DIFF_VERSIONS_COMMAND__EXPERIMENTAL,
	TOGGLE_CONNECT_COMMAND,
	createBindingV2__EXPERIMENTAL,
	createUndoManager,
	initLocalState,
	renderSnapshot__EXPERIMENTAL,
	syncLexicalUpdateToYjsV2__EXPERIMENTAL,
	syncYjsChangesToLexicalV2__EXPERIMENTAL,
	syncYjsStateToLexicalV2__EXPERIMENTAL,
	type BindingV2,
	type ExcludedProperties,
	type Provider,
} from '@lexical/yjs';

import {
	mergeRegister,
	SKIP_COLLAB_TAG,
	COMMAND_PRIORITY_EDITOR,
	type LexicalEditor,
	UNDO_COMMAND,
	REDO_COMMAND,
	CAN_UNDO_COMMAND,
	CAN_REDO_COMMAND,
	getActiveElement,
	registerEventListeners,
} from 'lexical';

import { UndoManager, type Doc, type Snapshot, type Transaction, type YEvent } from 'yjs';

type OnYjsTreeChanges = (events: YEvent<any>[], transaction: Transaction) => void;

const COLLAB_UNDO_MANAGER = Symbol.for('@lexical/yjs/UndoManager');

function useProvider(
	editor: LexicalEditor,
	provider: Provider,
	name: string,
	color: string,
	isReloadingDoc: { current: boolean },
	awarenessData?: object,
	onBootstrap?: () => void
): () => void {
	const connect = () => provider.connect();

	const disconnect = () => {
		try {
			provider.disconnect();
		} catch (_e) {
			// Do nothing.
		}
	};

	const onStatus = ({ status }: { status: string }) => {
		editor.dispatchCommand(CONNECTED_COMMAND, status === 'connected');
	};

	const onSync = (isSynced: boolean) => {
		if (isSynced && isReloadingDoc.current === false && onBootstrap) {
			onBootstrap();
		}
	};

	const rootElement = editor.getRootElement();

	initLocalState(
		provider,
		name,
		color,
		rootElement !== null && getActiveElement(rootElement) === rootElement,
		awarenessData || {}
	);

	provider.on('status', onStatus);
	provider.on('sync', onSync);

	const connectionPromise = connect();

	const unregisterToggleConnect = editor.registerCommand(
		TOGGLE_CONNECT_COMMAND,
		(payload) => {
			const shouldConnect = payload;

			if (shouldConnect) {
				console.log('Collaboration connected!');
				connect();
			} else {
				console.log('Collaboration disconnected!');
				disconnect();
			}

			return true;
		},
		COMMAND_PRIORITY_EDITOR
	);

	const unregisterPageEvents =
		typeof window !== 'undefined'
			? registerEventListeners(window, {
					beforeunload: clearAwarenessState,
					pagehide: clearAwarenessState,
				})
			: () => {};

	function clearAwarenessState() {
		try {
			provider.awareness.setLocalState(null);
		} catch (_e) {
			// Ignore errors during cleanup.
		}
	}

	return () => {
		if (isReloadingDoc.current === false) {
			if (connectionPromise) {
				connectionPromise.then(disconnect);
			} else {
				disconnect();
			}
		}

		provider.off('sync', onSync);
		provider.off('status', onStatus);

		unregisterToggleConnect();
		unregisterPageEvents();
	};
}

export function useYjsCollaborationV2__EXPERIMENTAL(
	editor: LexicalEditor,
	id: string,
	doc: Doc,
	provider: Provider,
	docMap: Map<string, Doc>,
	name: string,
	color: string,
	options: {
		awarenessData?: object;
		excludedProperties?: ExcludedProperties;
		rootName?: string;
		selectionHighlight?: boolean;
		__shouldBootstrapUnsafe?: boolean;
	} = {}
): {
	binding: BindingV2;
	destroy: () => void;
} {
	const { excludedProperties, rootName, __shouldBootstrapUnsafe: shouldBootstrap } = options;

	/*
	 * Exact V2 binding creation from Lexical.
	 */
	const binding = createBindingV2__EXPERIMENTAL(editor, id, doc, docMap, {
		excludedProperties,
		rootName,
	});

	/*
	 * Exact equivalent of:
	 *
	 * useEffect(() => {
	 *   docMap.set(id, doc);
	 *   return () => {
	 *     docMap.delete(id);
	 *   };
	 * }, [...]);
	 */
	docMap.set(id, doc);

	/*
	 * Lexical's V2 implementation has diff snapshot state.
	 *
	 * Svelte doesn't need React useState; a local variable is enough.
	 */
	let diffSnapshots: {
		prevSnapshot?: Snapshot;
		snapshot?: Snapshot;
	} | null = null;

	/*
	 * Exact CLEAR_DIFF_VERSIONS_COMMAND__EXPERIMENTAL behavior.
	 */
	const removeDiffCommands = mergeRegister(
		editor.registerCommand(
			CLEAR_DIFF_VERSIONS_COMMAND__EXPERIMENTAL,
			() => {
				diffSnapshots = null;

				syncYjsStateToLexicalV2__EXPERIMENTAL(binding, provider);

				return true;
			},
			COMMAND_PRIORITY_EDITOR
		),

		/*
		 * Exact DIFF_VERSIONS_COMMAND__EXPERIMENTAL behavior.
		 */
		editor.registerCommand(
			DIFF_VERSIONS_COMMAND__EXPERIMENTAL,
			({ prevSnapshot, snapshot }) => {
				diffSnapshots = {
					prevSnapshot,
					snapshot,
				};

				return true;
			},
			COMMAND_PRIORITY_EDITOR
		)
	);

	/*
	 * This is the second React effect in the original implementation.
	 *
	 * It is important that V2 observes `binding.root`, not
	 * `binding.root.getSharedType()`.
	 */
	const onYjsTreeChanges: OnYjsTreeChanges = (events, transaction) => {
		const origin = transaction.origin;

		if (origin !== binding) {
			const isFromUndoManger = origin instanceof UndoManager;

			syncYjsChangesToLexicalV2__EXPERIMENTAL(
				binding,
				provider,
				events,
				transaction,
				isFromUndoManger
			);
		}
	};

	/*
	 * Lexical → Yjs
	 */
	const removeListener = editor.registerUpdateListener(
		({ prevEditorState, editorState, dirtyLeaves, dirtyElements, normalizedNodes, tags }) => {
			if (!tags.has(SKIP_COLLAB_TAG)) {
				syncLexicalUpdateToYjsV2__EXPERIMENTAL(
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

	/*
	 * Yjs → Lexical
	 *
	 * In React this observer is installed/removed by useEffect.
	 */
	binding.root.observeDeep(onYjsTreeChanges);

	const isReloadingDoc = {
		current: false,
	};

	const onBootstrap = () => {};

	/*
	 * The React implementation invokes useProvider().
	 *
	 * We deliberately do NOT invoke useAwareness() or
	 * useYjsCursors(), since this editor doesn't use them.
	 *
	 * Provider setup is shown below.
	 */
	const destroyProvider = useProvider(
		editor,
		provider,
		name,
		color,
		isReloadingDoc,
		options.awarenessData,
		onBootstrap
	);

	const destroy = () => {
		binding.root.unobserveDeep(onYjsTreeChanges);

		removeListener();
		removeDiffCommands();
		destroyProvider();

		docMap.delete(id);
	};

	return {
		binding,
		destroy,
	};
}

export function useYjsHistoryV2(editor: LexicalEditor, binding: BindingV2): () => void {
	const undoManager = createUndoManager(binding, binding.root);

	const undo = () => {
		undoManager.undo();
	};

	const redo = () => {
		undoManager.redo();
	};

	const removeCommands = mergeRegister(
		editor.registerCommand(
			UNDO_COMMAND,
			() => {
				undo();
				return true;
			},
			COMMAND_PRIORITY_EDITOR
		),

		editor.registerCommand(
			REDO_COMMAND,
			() => {
				redo();
				return true;
			},
			COMMAND_PRIORITY_EDITOR
		)
	);

	const withManager = editor as LexicalEditor & Record<symbol, UndoManager | undefined>;

	withManager[COLLAB_UNDO_MANAGER] = undoManager;

	const updateUndoRedoStates = () => {
		editor.dispatchCommand(CAN_UNDO_COMMAND, undoManager.undoStack.length > 0);

		editor.dispatchCommand(CAN_REDO_COMMAND, undoManager.redoStack.length > 0);
	};

	undoManager.on('stack-item-added', updateUndoRedoStates);

	undoManager.on('stack-item-popped', updateUndoRedoStates);

	undoManager.on('stack-cleared', updateUndoRedoStates);

	return () => {
		removeCommands();

		undoManager.off('stack-item-added', updateUndoRedoStates);

		undoManager.off('stack-item-popped', updateUndoRedoStates);

		undoManager.off('stack-cleared', updateUndoRedoStates);

		if (withManager[COLLAB_UNDO_MANAGER] === undoManager) {
			delete withManager[COLLAB_UNDO_MANAGER];
		}
	};
}
