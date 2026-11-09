import { afterEach, expect, test } from 'vitest';
import {
	$createNodeSelection as createNodeSelection,
	$createParagraphNode as createParagraphNode,
	$createTextNode as createTextNode,
	$getRoot as getRoot,
	$getSelection as getSelection,
	$isParagraphNode as isParagraphNode,
	$isRangeSelection as isRangeSelection,
	$setSelection as setSelection,
	BEFORE_INPUT_COMMAND,
	type ElementNode,
	type LexicalEditor,
	type LexicalNode,
} from 'lexical';
import { buildEditorFromExtensions } from '@lexical/extension';

import { articleExtension } from '../config/article';
import { $createGalleryNode as createGalleryNode } from './Gallery/Gallery';
import { $createImageNode as createImageNode } from './Image/Image';
import { $createVideoEmbedNode as createVideoEmbedNode } from './VideoEmbed/VideoEmbed';
import { SelectionOverridesExtension } from './SelectionOverridesExtension';

const cleanups: Array<() => void> = [];

afterEach(() => {
	cleanups.splice(0).forEach((cleanup) => cleanup());
	document.body.innerHTML = '';
});

/** `build` returns the nodes to node-select. */
const setup = (build: () => LexicalNode[]) => {
	const editor = buildEditorFromExtensions(
		articleExtension(null, true, null),
		SelectionOverridesExtension
	);
	cleanups.push(() => editor.dispose());
	const root = document.body.appendChild(document.createElement('div'));
	root.contentEditable = 'true';
	editor.setRootElement(root);

	editor.update(
		() => {
			const selection = createNodeSelection();
			build().forEach((node) => selection.add(node.getKey()));
			setSelection(selection);
		},
		{ discrete: true }
	);
	return editor;
};

const type = (editor: LexicalEditor, data: string) => {
	const event = new InputEvent('beforeinput', { cancelable: true, data, inputType: 'insertText' });
	editor.update(() => editor.dispatchCommand(BEFORE_INPUT_COMMAND, event), { discrete: true });
	return event;
};

const blocks = (editor: LexicalEditor) =>
	editor.read(() =>
		getRoot()
			.getChildren()
			.map((node) => (isParagraphNode(node) ? node.getTextContent() : `<${node.getType()}>`))
	);

const paragraph = (text: string) => createParagraphNode().append(createTextNode(text));

test('types at the start of the block after a selected video embed', () => {
	const editor = setup(() => {
		const video = createVideoEmbedNode();
		getRoot().append(paragraph('before'), video, paragraph('after'));
		return [video];
	});

	type(editor, 'q');

	expect(blocks(editor)).toEqual(['before', '<videoembed>', 'qafter']);
});

test('types into a new paragraph when nothing follows the selected video embed', () => {
	const editor = setup(() => {
		const video = createVideoEmbedNode();
		getRoot().append(paragraph('before'), video);
		return [video];
	});

	type(editor, 'q');

	expect(blocks(editor)).toEqual(['before', '<videoembed>', 'q']);
});

test('types right after a selected inline image', () => {
	const editor = setup(() => {
		const image = createImageNode({ src: 'image.png' });
		getRoot().append(
			createParagraphNode().append(createTextNode('Alpha '), image, createTextNode(' end'))
		);
		return [image];
	});

	type(editor, 'q');

	expect(
		editor.read(() =>
			(getRoot().getFirstChildOrThrow() as ElementNode)
				.getChildren()
				.map((node) => (node.getType() === 'text' ? node.getTextContent() : `<${node.getType()}>`))
		)
	).toEqual(['Alpha ', '<image>', 'q end']);
});

test('types after the gallery when an image in it is selected', () => {
	const editor = setup(() => {
		const image = createImageNode({ src: 'image.png' });
		getRoot().append(
			paragraph('before'),
			createGalleryNode().append(image, createImageNode({ src: 'other.png' }))
		);
		return [image];
	});

	type(editor, 'q');

	expect(blocks(editor)).toEqual(['before', '<gallery>', 'q']);
	expect(editor.read(() => (getRoot().getChildAtIndex(1) as ElementNode).getChildrenSize())).toBe(
		2
	);
});

test('leaves typing with a caret alone', () => {
	const editor = setup(() => []);
	editor.update(
		() => {
			getRoot().append(paragraph('before'), createVideoEmbedNode());
			(getRoot().getFirstChildOrThrow() as ElementNode).selectEnd();
		},
		{ discrete: true }
	);

	// Lexical leaves plain typing at a caret to the browser, which a synthetic event doesn't do.
	const event = type(editor, 'q');

	expect(event.defaultPrevented).toBe(false);
	expect(blocks(editor)).toEqual(['before', '<videoembed>']);
	expect(
		editor.read(() => {
			const selection = getSelection();
			return isRangeSelection(selection) ? selection.anchor.getNode().getTextContent() : null;
		})
	).toBe('before');
});

test('ignores typing while several nodes are selected', () => {
	const editor = setup(() => {
		const first = createVideoEmbedNode();
		const second = createVideoEmbedNode();
		getRoot().append(first, second);
		return [first, second];
	});

	const event = type(editor, 'q');

	expect(event.defaultPrevented).toBe(true);
	expect(blocks(editor)).toEqual(['<videoembed>', '<videoembed>']);
});
