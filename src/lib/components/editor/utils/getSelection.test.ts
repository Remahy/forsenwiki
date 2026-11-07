import { expect, test, vi } from 'vitest';
import { get } from 'svelte/store';
import { $createNodeSelection, $createParagraphNode, $getRoot, $setSelection } from 'lexical';
import { createHeadlessEditor } from '@lexical/headless';

import { createNodeSelectionStore } from './getSelection';

test('only listens to the editor while subscribed', () => {
	const editor = createHeadlessEditor();
	const unregister = vi.fn();
	const register = vi.spyOn(editor, 'registerUpdateListener').mockReturnValue(unregister);

	const store = createNodeSelectionStore(editor, 'key');
	expect(register).not.toHaveBeenCalled();

	const unsubscribe = store.subscribe(() => {});
	expect(register).toHaveBeenCalledOnce();

	unsubscribe();
	expect(unregister).toHaveBeenCalledOnce();
});

test('follows the editor selection', () => {
	const editor = createHeadlessEditor();
	let key = '';
	editor.update(
		() => {
			const paragraph = $createParagraphNode();
			$getRoot().append(paragraph);
			key = paragraph.getKey();

			const selection = $createNodeSelection();
			selection.add(key);
			$setSelection(selection);
		},
		{ discrete: true }
	);

	expect(get(createNodeSelectionStore(editor, key))).toBe(true);
});
