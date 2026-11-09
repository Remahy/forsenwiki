import { afterEach, expect, test } from 'vitest';
import { get } from 'svelte/store';
import {
	$getRoot as getRoot,
	$isElementNode as isElementNode,
	KEY_ARROW_LEFT_COMMAND,
	KEY_ARROW_RIGHT_COMMAND,
	type LexicalEditor,
} from 'lexical';
import { buildEditorFromExtensions, type LexicalEditorWithDispose } from '@lexical/extension';
import {
	$createTableNodeWithDimensions as createTableNodeWithDimensions,
	$isTableNode as isTableNode,
	INSERT_TABLE_COMMAND,
} from '@lexical/table';

import { modal } from '$lib/stores/modal';
import InsertTableDialog from '$lib/components/editor/toolbar/Table/InsertTableDialog.svelte';
import { articleExtension } from '../../../config/article';
import { ATableExtension } from './ATableExtension';

const editors: LexicalEditorWithDispose[] = [];

afterEach(() => {
	editors.splice(0).forEach((editor) => editor.dispose());
	modal.set(undefined as never);
});

const setup = () => {
	const editor = buildEditorFromExtensions(articleExtension(null, true, null), ATableExtension);
	editors.push(editor);
	return editor;
};

const types = (editor: LexicalEditor) =>
	editor.read(() =>
		getRoot()
			.getChildren()
			.map((node) => node.getType())
	);

const arrow = (ctrlKey = false) => ({ ctrlKey }) as KeyboardEvent;

test('inserting a table opens the dialog and the dialog inserts the table', () => {
	const editor = setup();

	editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: '2', rows: '3', includeHeaders: false });

	const state = get(modal);
	expect(state).toMatchObject({ isOpen: true, component: InsertTableDialog, columns: '2' });

	(state.onSubmit as (data: unknown) => void)({ columns: '2', rows: '3', includeHeaders: false });

	const rows = editor.read(() => {
		const [table] = getRoot().getChildren();
		return isTableNode(table) ? table.getChildrenSize() : 0;
	});
	expect(types(editor)).toEqual(['a-table', 'paragraph']);
	expect(rows).toBe(3);
});

test('arrow keys at the table edges add a paragraph beside the table', () => {
	const editor = setup();
	editor.update(
		() => {
			const table = createTableNodeWithDimensions(1, 1, false);
			getRoot().append(table);
			table.getFirstDescendant()?.selectStart();
		},
		{ discrete: true }
	);

	editor.dispatchCommand(KEY_ARROW_RIGHT_COMMAND, arrow(true));
	expect(types(editor)).toEqual(['a-table']);

	editor.dispatchCommand(KEY_ARROW_RIGHT_COMMAND, arrow());
	expect(types(editor)).toEqual(['a-table', 'paragraph']);

	editor.update(
		() => {
			const table = getRoot().getFirstChild();
			if (isElementNode(table)) {
				table.getFirstDescendant()?.selectStart();
			}
		},
		{ discrete: true }
	);
	editor.dispatchCommand(KEY_ARROW_LEFT_COMMAND, arrow());
	expect(types(editor)).toEqual(['paragraph', 'a-table', 'paragraph']);

	editor.dispatchCommand(KEY_ARROW_LEFT_COMMAND, arrow());
	expect(types(editor)).toEqual(['paragraph', 'a-table', 'paragraph']);
});

test('dispose unregisters the commands', () => {
	const editor = setup();
	editor.dispose();

	editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: '2', rows: '2' });

	expect(get(modal)).toBeUndefined();
});
