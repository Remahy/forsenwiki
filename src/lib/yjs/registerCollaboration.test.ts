import { expect, test, vi } from 'vitest';
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	CAN_REDO_COMMAND,
	CAN_UNDO_COMMAND,
	COMMAND_PRIORITY_CRITICAL,
	REDO_COMMAND,
	SKIP_COLLAB_TAG,
	UNDO_COMMAND,
	type LexicalEditor,
} from 'lexical';
import { buildEditorFromExtensions } from '@lexical/extension';
import type { Provider } from '@lexical/yjs';

import { articleExtension } from '$lib/components/editor/config/article';
import { EDITOR_IS_EDITABLE, EDITOR_IS_READONLY } from '$lib/constants/constants';
import { getYjsAndEditor } from './getYjsAndEditor';
import { registerCollaboration } from './registerCollaboration';
import { applyDiffToYDoc, createNewYDoc, encodeYDocToUpdate, encodeYDocToUpdateV2 } from './utils';

const noop = () => {};

const createProvider = () =>
	({
		awareness: {
			getLocalState: () => null,
			getStates: () => new Map(),
			off: noop,
			on: noop,
			setLocalState: noop,
			setLocalStateField: noop,
		},
		connect: vi.fn(),
		disconnect: vi.fn(),
		off: noop,
		on: noop,
	}) satisfies Provider;

const setup = () => {
	const editor = buildEditorFromExtensions(articleExtension(null, EDITOR_IS_EDITABLE, null));
	const doc = createNewYDoc();
	const provider = createProvider();
	const unregister = registerCollaboration(editor, {
		id: 'test',
		provider,
		docMap: new Map([['test', doc]]),
	});
	return { editor, doc, provider, unregister };
};

const write = (editor: LexicalEditor, text: string, tag?: string) => {
	editor.update(
		() => {
			$getRoot().append($createParagraphNode().append($createTextNode(text)));
		},
		{ discrete: true, tag }
	);
};

const readText = (editor: LexicalEditor) =>
	editor.getEditorState().read(() => $getRoot().getTextContent());

/** How the backend reads an article from its Yjs update. */
const readDoc = (doc: YDoc) =>
	readText(
		getYjsAndEditor(articleExtension(null, EDITOR_IS_READONLY, null), encodeYDocToUpdateV2(doc))
			.editor
	);

// Lexical commits the updates that come from Yjs in a microtask.
const settle = () => new Promise((resolve) => setTimeout(resolve));

/** Same origin the IndexedDB provider uses when it loads an article. */
const applyRemote = async (doc: YDoc, text: string) => {
	const source = setup();
	write(source.editor, text);
	applyDiffToYDoc(doc, encodeYDocToUpdate(source.doc), { isUpdateRemote: true });
	await settle();
};

test('writes editor updates to the Yjs doc', () => {
	const { editor, doc } = setup();

	write(editor, 'hello');

	expect(readDoc(doc)).toBe('hello');
});

test('applies remote Yjs updates to the editor', async () => {
	const { editor, doc } = setup();

	await applyRemote(doc, 'remote');

	expect(readText(editor)).toBe('remote');
});

test('skips updates tagged SKIP_COLLAB_TAG', () => {
	const { editor, doc } = setup();

	write(editor, 'local only', SKIP_COLLAB_TAG);

	expect(readDoc(doc)).toBe('');
});

test('undoes and redoes local edits, but not the loaded article', async () => {
	const { editor, doc } = setup();
	await applyRemote(doc, 'loaded');
	write(editor, 'typed');

	editor.dispatchCommand(UNDO_COMMAND, undefined);
	await settle();
	expect(readText(editor)).toBe('loaded');

	editor.dispatchCommand(REDO_COMMAND, undefined);
	await settle();
	expect(readText(editor)).toBe('loaded\n\ntyped');
});

test('reports whether undo and redo are available', async () => {
	const { editor, doc } = setup();
	await applyRemote(doc, 'loaded');
	const can = { undo: false, redo: false };
	editor.registerCommand(
		CAN_UNDO_COMMAND,
		(payload) => {
			can.undo = payload;
			return false;
		},
		COMMAND_PRIORITY_CRITICAL
	);
	editor.registerCommand(
		CAN_REDO_COMMAND,
		(payload) => {
			can.redo = payload;
			return false;
		},
		COMMAND_PRIORITY_CRITICAL
	);

	write(editor, 'typed');
	expect(can).toEqual({ undo: true, redo: false });

	editor.dispatchCommand(UNDO_COMMAND, undefined);
	await settle();
	expect(can).toEqual({ undo: false, redo: true });
});

test('connects, and disconnects and stops syncing when unregistered', async () => {
	const { editor, doc, provider, unregister } = setup();
	expect(provider.connect).toHaveBeenCalledOnce();

	unregister();
	expect(provider.disconnect).toHaveBeenCalledOnce();

	write(editor, 'local');
	expect(readDoc(doc)).toBe('');

	await applyRemote(doc, 'remote');
	expect(readText(editor)).toBe('local');
});
