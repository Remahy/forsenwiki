import { expect, test, vi } from 'vitest';
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$isElementNode,
	UNDO_COMMAND,
	type LexicalEditor,
	type LexicalNode,
} from 'lexical';
import {
	$getBlockById,
	$getBlockId,
	BlockIdExtension,
	buildEditorFromExtensions,
	configExtension,
} from '@lexical/extension';
import { HeadlessExtension } from '@lexical/headless';
import { $createListItemNode, $createListNode } from '@lexical/list';
import { $createTableNodeWithDimensions } from '@lexical/table';
import type { Provider } from '@lexical/yjs';

import { $createFloatBlockNode } from '$lib/components/editor/plugins/FloatBlock/FloatBlock';
import { $createGalleryNode } from '$lib/components/editor/plugins/Gallery/Gallery';
import { $createImageNode } from '$lib/components/editor/plugins/Image/Image';
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

const setup = (...extensions: Parameters<typeof buildEditorFromExtensions>) => {
	const editor = buildEditorFromExtensions(
		articleExtension(null, EDITOR_IS_EDITABLE, null),
		...extensions
	);
	const doc = createNewYDoc();
	registerCollaboration(editor, {
		id: 'test',
		provider: createProvider(),
		docMap: new Map([['test', doc]]),
	});
	return { editor, doc };
};

/** An article saved before block ids existed. */
const setupWithoutIds = () => setup(configExtension(BlockIdExtension, { disabled: true }));

const settle = () => new Promise((resolve) => setTimeout(resolve));

const $build = () => {
	const list = $createListNode('bullet').append(
		$createListItemNode().append($createTextNode('item'))
	);
	$getRoot().append(
		$createParagraphNode().append($createTextNode('first')),
		list,
		$createTableNodeWithDimensions(1, 1, false),
		$createFloatBlockNode({ float: 'right', width: 300, height: 200, hasBorder: true }).append(
			$createParagraphNode().append($createTextNode('in float'))
		),
		$createGalleryNode().append($createImageNode({ src: 'https://example.com/a.png' }))
	);
};

const build = (editor: LexicalEditor) => editor.update($build, { discrete: true });

const blockIds = (editor: LexicalEditor) =>
	editor.getEditorState().read(() => {
		const ids: Record<string, string> = {};
		const $visit = (node: LexicalNode, path: string) => {
			const id = $getBlockId(node);
			if (id !== null) {
				ids[`${path}:${node.getType()}`] = id;
			}
			if ($isElementNode(node)) {
				node.getChildren().forEach((child, i) => $visit(child, `${path}/${i}`));
			}
		};
		$getRoot()
			.getChildren()
			.forEach((child, i) => $visit(child, `${i}`));
		return ids;
	});

const readBackend = (doc: YDoc) =>
	getYjsAndEditor(articleExtension(null, EDITOR_IS_READONLY, null), encodeYDocToUpdateV2(doc))
		.editor;

test('gives top-level blocks and nested text blocks ids', () => {
	const editor = buildEditorFromExtensions(
		HeadlessExtension,
		articleExtension(null, EDITOR_IS_EDITABLE, null)
	);
	build(editor);

	expect(Object.keys(blockIds(editor))).toEqual([
		'0:paragraph',
		'1:list',
		'1/0:listitem',
		'2:a-table',
		'2/0/0/0:paragraph',
		'3:float-block',
		'3/0:paragraph',
		'4:gallery',
		'4/0:image',
	]);
	expect(new Set(Object.values(blockIds(editor))).size).toBe(9);
});

test('ids round-trip through JSON and are looked up by id', () => {
	const editor = buildEditorFromExtensions(
		HeadlessExtension,
		articleExtension(null, EDITOR_IS_EDITABLE, null)
	);
	build(editor);
	const ids = blockIds(editor);

	const reloaded = buildEditorFromExtensions(
		HeadlessExtension,
		articleExtension(null, EDITOR_IS_EDITABLE, null)
	);
	reloaded.setEditorState(reloaded.parseEditorState(JSON.stringify(editor.getEditorState())));

	expect(blockIds(reloaded)).toEqual(ids);
	expect(reloaded.read(() => $getBlockById(ids['0:paragraph'])?.getTextContent())).toBe('first');
});

test('ids sync through Yjs to the backend', () => {
	const { editor, doc } = setup();
	build(editor);

	expect(blockIds(readBackend(doc))).toEqual(blockIds(editor));
});

test('a split block gets a new id', () => {
	const editor = buildEditorFromExtensions(
		HeadlessExtension,
		articleExtension(null, EDITOR_IS_EDITABLE, null)
	);
	build(editor);
	const before = blockIds(editor)['0:paragraph'];

	editor.update(
		() => {
			$getRoot().getFirstChildOrThrow().selectEnd().insertParagraph();
		},
		{ discrete: true }
	);

	const ids = blockIds(editor);
	expect(ids['0:paragraph']).toBe(before);
	expect(ids['1:paragraph']).toBeTruthy();
	expect(ids['1:paragraph']).not.toBe(before);
});

test('articles without ids get the same positional ids on every reader', async () => {
	const source = setupWithoutIds();
	build(source.editor);
	expect(blockIds(source.editor)).toEqual({});

	const client = setup();
	applyDiffToYDoc(client.doc, encodeYDocToUpdate(source.doc), { isUpdateRemote: true });
	await settle();

	const ids = blockIds(client.editor);
	expect(Object.keys(ids)).toHaveLength(9);
	expect(blockIds(readBackend(source.doc))).toEqual(ids);
	// The client stored the ids it shows.
	expect(blockIds(readBackend(client.doc))).toEqual(ids);
});

test('undo after loading an article without ids keeps the ids', async () => {
	const source = setupWithoutIds();
	build(source.editor);

	const client = setup();
	applyDiffToYDoc(client.doc, encodeYDocToUpdate(source.doc), { isUpdateRemote: true });
	await settle();
	const ids = blockIds(client.editor);

	client.editor.update(
		() => {
			$getRoot().append($createParagraphNode().append($createTextNode('typed')));
		},
		{ discrete: true }
	);
	client.editor.dispatchCommand(UNDO_COMMAND, undefined);
	await settle();

	expect(blockIds(client.editor)).toEqual(ids);
});
