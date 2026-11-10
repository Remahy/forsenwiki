import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
	$createParagraphNode as createParagraphNode,
	$createTextNode as createTextNode,
	$getRoot as getRoot,
	$getSelection as getSelection,
	$isNodeSelection as isNodeSelection,
	type LexicalEditor,
	type LexicalNode,
} from 'lexical';
import {
	buildEditorFromExtensions,
	getExtensionDependencyFromEditor,
	type LexicalEditorWithDispose,
} from '@lexical/extension';

import { articleExtension } from '../config/article';
import { $createVideoEmbedNode as createVideoEmbedNode } from '../plugins/VideoEmbed/VideoEmbed';
import { TreeviewExtension } from './TreeviewExtension';

const editors: LexicalEditorWithDispose[] = [];

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	editors.splice(0).forEach((editor) => editor.dispose());
	vi.useRealTimers();
});

const setup = () => {
	const editor = buildEditorFromExtensions(articleExtension(null, true, null), TreeviewExtension);
	editors.push(editor);
	const output = getExtensionDependencyFromEditor(editor, TreeviewExtension).output;
	output.tree.setMounted(true);
	return { editor, ...output };
};

const settle = () => vi.advanceTimersByTime(1100);

const append = (editor: LexicalEditor, build: () => LexicalNode) => {
	let key = '';
	editor.update(
		() => {
			const node = build();
			getRoot().append(node);
			key = node.getKey();
		},
		{ discrete: true }
	);
	settle();
	return key;
};

test('lists the editor nodes after a structural change', () => {
	const { editor, items } = setup();

	const key = append(editor, () => createParagraphNode().append(createTextNode('hello')));

	expect(items.value.map((item) => item.getId())).toEqual([key]);
});

test('follows the editor selection', () => {
	const { editor, selected, tree } = setup();
	append(editor, () => createParagraphNode().append(createTextNode('hello')));

	editor.update(() => getRoot().getFirstChildOrThrow().selectEnd(), { discrete: true });
	settle();

	expect(selected.value?.getType()).toBe('text');
	expect(tree.getSelectedItems().map((item) => item.getId())).toEqual([selected.value?.getKey()]);
});

test('selecting an item node-selects a decorator in the editor', () => {
	const { editor, selected, selectItem, tree } = setup();
	append(editor, () => createParagraphNode().append(createTextNode('hello')));
	const key = append(editor, () => createVideoEmbedNode());

	selectItem(tree.getItemInstance(key));

	expect(selected.value?.getKey()).toBe(key);
	expect(
		editor.read(() => {
			const selection = getSelection();
			return isNodeSelection(selection) ? selection.getNodes()[0].getKey() : null;
		})
	).toBe(key);
});

test('dispose stops following the editor', () => {
	const { editor, items } = setup();
	append(editor, () => createParagraphNode().append(createTextNode('hello')));
	const before = items.value;

	editor.dispose();
	append(editor, () => createParagraphNode().append(createTextNode('later')));

	expect(items.value).toBe(before);
});
