import { describe, expect, test } from 'vitest';
import { $getRoot, $parseSerializedNode, type SerializedLexicalNode } from 'lexical';
import { createHeadlessEditor } from '@lexical/headless';
import { $generateHtmlFromNodes } from '@lexical/html';

import { articleConfig } from '../../config/article';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';
import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor';
import { createNewYDoc, encodeYDocToUpdateV2 } from '$lib/yjs/utils';
import { $createFallbackNode, $isFallbackNode, type FallbackNode } from './Fallback';
import {
	$createDeprecatedVideoEmbedNode,
	DeprecatedVideoEmbedNode,
} from '../Deprecated/DeprecatedVideoEmbedNode';

const legacyYouTube = {
	type: 'youtube',
	version: 1,
	format: 'center',
	platform: 'youtube',
	src: 'https://youtu.be/abc',
};

const config = () => articleConfig(null, EDITOR_IS_READONLY, null);

const $firstChild = () => $getRoot().getFirstChildOrThrow<FallbackNode>();

/** Same as the toHTML worker, which reads the article from its Yjs update. */
const htmlFromYjs = (build: () => void) => {
	const { editor, doc } = getYjsAndEditor(config(), encodeYDocToUpdateV2(createNewYDoc()));
	editor.update(build, { discrete: true });

	const reloaded = getYjsAndEditor(config(), encodeYDocToUpdateV2(doc)).editor;

	return reloaded.read(() => $generateHtmlFromNodes(reloaded, null));
};

describe('FallbackNode', () => {
	test('legacy node keeps its type and original JSON', () => {
		const editor = createHeadlessEditor(config());
		editor.update(() => $getRoot().append($parseSerializedNode(legacyYouTube)), { discrete: true });

		editor.read(() => {
			const node = $firstChild();
			expect(node).toBeInstanceOf(DeprecatedVideoEmbedNode);
			expect(node.getType()).toBe('youtube');
			expect(node.getFormatType()).toBe('center');
			expect(JSON.parse(node.__data!)).toEqual(legacyYouTube);
		});
	});

	test('legacy node exports to HTML from Yjs', () => {
		const html = htmlFromYjs(() => $getRoot().append($parseSerializedNode(legacyYouTube)));

		expect(html).toContain('Invalid node of type: "youtube"');
	});

	test('node without data exports to HTML from Yjs', () => {
		// Documents saved before this fix stored the legacy node with empty data.
		const html = htmlFromYjs(() => $getRoot().append($createDeprecatedVideoEmbedNode('')));

		expect(html).toContain('Invalid node of type: "youtube"');
	});

	test('round trips through JSON', () => {
		const data = JSON.stringify({ type: 'mystery' });
		const editor = createHeadlessEditor(config());
		editor.update(() => $getRoot().append($createFallbackNode({ data, format: 'right' })), {
			discrete: true,
		});

		const json = editor.read(() => $firstChild().exportJSON());
		const imported = createHeadlessEditor(config());
		imported.update(() => $getRoot().append($parseSerializedNode(json as SerializedLexicalNode)), {
			discrete: true,
		});

		imported.read(() => {
			const node = $firstChild();
			expect($isFallbackNode(node)).toBe(true);
			expect(node.__data).toBe(data);
			expect(node.getFormatType()).toBe('right');
		});
		expect(imported.read(() => $generateHtmlFromNodes(imported, null))).toContain(
			'Invalid node of type: "mystery"'
		);
	});

	test('keeps its format when cloned', () => {
		const editor = createHeadlessEditor(config());
		editor.update(() => $getRoot().append($createFallbackNode({ data: '{}', format: 'center' })), {
			discrete: true,
		});
		// getWritable() clones the node from the previous editor state.
		editor.update(() => $firstChild().setDirection('rtl'), { discrete: true });

		editor.read(() => expect($firstChild().getFormatType()).toBe('center'));
	});
});
