import { afterEach, expect, test } from 'vitest';
import { get } from 'svelte/store';
import { $getRoot as getRoot, $isElementNode as isElementNode } from 'lexical';
import { buildEditorFromExtensions, type LexicalEditorWithDispose } from '@lexical/extension';

import { modal } from '$lib/stores/modal';
import EditImageModal from '$lib/components/editor/toolbar/Image/EditImageModal.svelte';
import { articleExtension } from '../../config/article';
import { ImageExtension, INSERT_IMAGE_COMMAND } from './ImageExtension';

const editors: LexicalEditorWithDispose[] = [];

afterEach(() => {
	editors.splice(0).forEach((editor) => editor.dispose());
	modal.set(undefined as never);
});

const setup = () => {
	const editor = buildEditorFromExtensions(articleExtension(null, true, null), ImageExtension);
	editors.push(editor);
	return editor;
};

const tree = (editor: LexicalEditorWithDispose) =>
	editor.read(() =>
		getRoot()
			.getChildren()
			.map((node) =>
				isElementNode(node)
					? `${node.getType()}(${node
							.getChildren()
							.map((child) => child.getType())
							.join(',')})`
					: node.getType()
			)
	);

test('inserting an image opens the dialog and the dialog inserts the image in a paragraph', () => {
	const editor = setup();

	editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: 'image.png', altText: 'alt' });

	const state = get(modal);
	expect(state).toMatchObject({ isOpen: true, component: EditImageModal, src: 'image.png' });

	(state.onSubmit as (data: unknown) => void)({ src: 'image.png', altText: 'alt' });

	expect(tree(editor)).toEqual(['paragraph(image)', 'paragraph()']);
});

test('dispose unregisters the commands', () => {
	const editor = setup();
	editor.dispose();

	editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: 'image.png' });

	expect(get(modal)).toBeUndefined();
});
