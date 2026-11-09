import { expect, test } from 'vitest';
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$isElementNode,
	$parseSerializedNode,
	type LexicalEditor,
	type SerializedLexicalNode,
} from 'lexical';
import { buildEditorFromExtensions } from '@lexical/extension';
import { HeadlessExtension } from '@lexical/headless';
import { $createTableNodeWithDimensions } from '@lexical/table';

import { articleExtension } from '../config/article';
import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor';
import { createNewYDoc, encodeYDocToUpdateV2 } from '$lib/yjs/utils';
import { $createALinkNode } from './Overrides/ALink';
import { $createFloatBlockNode } from './FloatBlock/FloatBlock';
import { $createGalleryNode } from './Gallery/Gallery';
import { $createImageNode } from './Image/Image';
import { $createVideoEmbedNode } from './VideoEmbed/VideoEmbed';

const config = () => articleExtension(null, true, null);

// Custom fields use values that differ from the constructor defaults.
const $build = () => {
	$getRoot().append(
		$createParagraphNode().append(
			$createALinkNode('/w/forsen', { title: 'Forsen' }, true, 'post-id').append(
				$createTextNode('internal')
			),
			$createALinkNode('https://example.com', { rel: 'noreferrer' }).append(
				$createTextNode('external')
			)
		),
		$createTableNodeWithDimensions(2, 2, true),
		$createFloatBlockNode({ float: 'right', width: 300, height: 200, hasBorder: true }).append(
			$createParagraphNode().append($createTextNode('in float'))
		),
		$createGalleryNode().append($createImageNode({ src: 'https://example.com/a.png' })),
		$createImageNode({ src: 'https://example.com/b.png', altText: 'b', width: 320, height: 240 }),
		$createVideoEmbedNode({
			platform: 'usercontent',
			src: 'abc.mp4',
			width: 640,
			height: 360,
			altText: 'video',
			fileType: 'video',
			subtitles: [{ id: 'sub', src: 'sv.vtt', title: 'Svenska', language: 'sv' }],
			format: 'center',
		}).setDirection('rtl')
	);
};

const json = (editor: LexicalEditor) => editor.getEditorState().toJSON();

const createEditor = () => {
	const editor = buildEditorFromExtensions(HeadlessExtension, config());
	editor.update($build, { discrete: true });
	return editor;
};

test('nodes keep their type and fields', () => {
	const types = json(createEditor()).root.children.flatMap((node) => [
		node.type,
		...((node as { children?: SerializedLexicalNode[] }).children ?? []).map(({ type }) => type),
	]);

	expect(types).toEqual(expect.arrayContaining(['a-link', 'a-table', 'float-block', 'gallery']));
});

test('nodes survive a JSON round trip', () => {
	const editor = createEditor();
	const imported = buildEditorFromExtensions(HeadlessExtension, config());
	imported.setEditorState(imported.parseEditorState(json(editor)));

	expect(json(imported)).toEqual(json(editor));
});

test('nodes survive a Yjs round trip', () => {
	const { editor, doc } = getYjsAndEditor(config(), encodeYDocToUpdateV2(createNewYDoc()));
	editor.update($build, { discrete: true });

	const reloaded = getYjsAndEditor(config(), encodeYDocToUpdateV2(doc)).editor;

	expect(json(reloaded)).toEqual(json(editor));
});

test('nodes keep their fields when cloned', () => {
	const editor = createEditor();
	const before = json(editor);

	// getWritable() clones every node from the previous editor state.
	editor.update(
		() => {
			const $markAll = (node: ReturnType<typeof $getRoot>) => {
				for (const child of node.getChildren()) {
					child.getWritable();
					if ($isElementNode(child)) {
						$markAll(child as never);
					}
				}
			};
			$markAll($getRoot());
		},
		{ discrete: true }
	);

	expect(json(editor)).toEqual(before);
});

test('legacy link JSON without __isInternal is external', () => {
	const editor = buildEditorFromExtensions(HeadlessExtension, config());
	editor.update(
		() => {
			const link = $parseSerializedNode({
				type: 'a-link',
				version: 1,
				url: 'https://example.com',
				children: [],
				direction: null,
				format: '',
				indent: 0,
			} as SerializedLexicalNode);
			$getRoot().append($createParagraphNode().append(link));
		},
		{ discrete: true }
	);

	const link = json(editor).root.children[0] as unknown as { children: Record<string, unknown>[] };
	expect(link.children[0]).toMatchObject({ __isInternal: false, target: '_blank' });
});
