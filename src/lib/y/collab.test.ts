import { expect, test } from 'vitest';
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
import { buildEditorFromExtensions, getExtensionDependencyFromEditor } from '@lexical/extension';
import { createYCollabConfig, createYDoc, YCollabExtension } from '@lexical/y';

import { articleExtension } from '$lib/components/editor/config/article';
import { EDITOR_IS_EDITABLE, EDITOR_IS_READONLY } from '$lib/constants/constants';
import { yCollabInput } from './config';
import { getYAndEditor, readState, seedState } from './headless';
import { applyRemoteUpdateV2, encodeYDocToUpdateV2 } from './utils';

const config = () => articleExtension(null, EDITOR_IS_READONLY, null);

/** A client: the editor bound to its document, as editor.svelte builds it. */
const setup = (updateV2?: Uint8Array) => {
	const doc = createYDoc();
	if (updateV2) {
		applyRemoteUpdateV2(doc, updateV2);
	}
	const editor = buildEditorFromExtensions(
		articleExtension(null, EDITOR_IS_EDITABLE, null),
		createYCollabConfig(yCollabInput(doc))
	);
	const { binding, status } = getExtensionDependencyFromEditor(editor, YCollabExtension).output;
	binding.initialize();
	return { editor, doc, binding, status };
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

/** How the backend reads an article from its stored update. */
const readDoc = (doc: YDoc) =>
	readState(config(), encodeYDocToUpdateV2(doc), () => $getRoot().getTextContent());

// Lexical commits the updates that come from Yjs in a microtask.
const settle = () => new Promise((resolve) => setTimeout(resolve));

const seeded = (text: string) =>
	seedState(config(), () => {
		$getRoot().append($createParagraphNode().append($createTextNode(text)));
	});

test('writes editor updates to the Yjs doc', () => {
	const { editor, doc, status } = setup();

	expect(status.value).toBe('active');
	write(editor, 'hello');

	expect(readDoc(doc)).toBe('hello');
});

test('shows a loaded article and merges a remote change', async () => {
	const { editor, doc } = setup(seeded('loaded'));
	expect(readText(editor)).toBe('loaded');

	const other = setup(encodeYDocToUpdateV2(doc));
	write(other.editor, 'remote');
	applyRemoteUpdateV2(doc, encodeYDocToUpdateV2(other.doc));
	await settle();

	expect(readText(editor)).toBe('loaded\n\nremote');
});

test('skips updates tagged SKIP_COLLAB_TAG', () => {
	const { editor, doc } = setup();

	write(editor, 'local only', SKIP_COLLAB_TAG);

	expect(readDoc(doc)).toBe('');
});

test('undoes and redoes local edits, but not the loaded article', async () => {
	const { editor } = setup(seeded('loaded'));
	write(editor, 'typed');

	editor.dispatchCommand(UNDO_COMMAND, undefined);
	await settle();
	expect(readText(editor)).toBe('loaded');

	editor.dispatchCommand(REDO_COMMAND, undefined);
	await settle();
	expect(readText(editor)).toBe('loaded\n\ntyped');
});

test('reports whether undo and redo are available', async () => {
	const { editor } = setup(seeded('loaded'));
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
	await settle();
	expect(can).toEqual({ undo: true, redo: false });

	editor.dispatchCommand(UNDO_COMMAND, undefined);
	await settle();
	expect(can).toEqual({ undo: false, redo: true });
});

test('stops syncing when disposed', async () => {
	const { editor, doc } = setup();
	editor.dispose();

	write(editor, 'local');
	expect(readDoc(doc)).toBe('');
});

test('the backend editor reads, edits and re-encodes an article', async () => {
	const { editor, doc } = setup(seeded('loaded'));
	write(editor, 'typed');

	const backend = getYAndEditor(config(), encodeYDocToUpdateV2(doc));
	expect(readText(backend.editor)).toBe('loaded\n\ntyped');

	backend.editor.update(
		() => {
			$getRoot().getLastChildOrThrow().remove();
		},
		{ discrete: true }
	);
	const update = await backend.encodeV2();
	backend.dispose();

	expect(readState(config(), update, () => $getRoot().getTextContent())).toBe('loaded');
});

test('a seed is deterministic', () => {
	expect(seeded('same')).toEqual(seeded('same'));
});
