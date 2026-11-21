import { expect, test } from 'vitest';
import { $createParagraphNode, $createTextNode, $getRoot, type LexicalNode } from 'lexical';
import { $getBlockId, buildEditorFromExtensions } from '@lexical/extension';
import { HeadlessExtension } from '@lexical/headless';
import { $createHeadingNode } from '@lexical/rich-text';

import { articleExtension } from '../config/article';
import { $createALinkNode } from '$lib/lexical/custom';
import { EDITOR_IS_EDITABLE } from '$lib/constants/constants';
import { InvalidArticleError } from '$lib/errors/InvalidArticle';
import { validateArticle } from './validateArticle';

const setup = (build: () => Record<string, LexicalNode>) => {
	const editor = buildEditorFromExtensions(
		HeadlessExtension,
		articleExtension(null, EDITOR_IS_EDITABLE, null)
	);

	let nodes: Record<string, LexicalNode> = {};
	editor.update(
		() => {
			$getRoot().clear();
			nodes = build();
		},
		{ discrete: true }
	);

	return { editor, nodes };
};

const link = (url: string, internal: boolean) =>
	$createALinkNode(url, {}, internal, internal ? 'post' : undefined).append($createTextNode(url));

const refusal = (editor: Parameters<typeof validateArticle>[0]) => {
	try {
		validateArticle(editor);
	} catch (err) {
		return err as InvalidArticleError;
	}

	return null;
};

test('an article without paragraphs is refused, about no block in particular', () => {
	const { editor } = setup(() => {
		$getRoot().append($createHeadingNode('h1').append($createTextNode('Only a heading')));

		return {};
	});

	const err = refusal(editor);

	expect(err).toBeInstanceOf(InvalidArticleError);
	expect(err?.message).toBe('The article has no paragraphs.');
	expect(err?.blocks).toEqual([]);
});

test('every malformed internal link is reported with the blocks holding them', () => {
	const { editor, nodes } = setup(() => {
		const first = $createParagraphNode().append(
			link('https://forsen.wiki/w/forsen', true),
			link('w/forsen', true)
		);
		const second = $createParagraphNode().append(link('forsen', true));
		const fine = $createParagraphNode().append(
			link('/w/forsen', true),
			link('https://example.com', false)
		);

		$getRoot().append(first, second, fine);

		return { first, second };
	});

	const ids = editor.read(() =>
		[nodes.first, nodes.second].map((node) => $getBlockId(node.getLatest()))
	);
	const err = refusal(editor);

	expect(err).toBeInstanceOf(InvalidArticleError);
	expect(err?.message).toBe('3 internal links are malformed. Link them to their articles again.');
	expect(err?.blocks).toEqual(ids.map((id) => ({ id, label: 'link' })));
});

test('an article with paragraphs and well-formed links passes', () => {
	const { editor } = setup(() => {
		$getRoot().append($createParagraphNode().append(link('/w/forsen', true)));

		return {};
	});

	expect(refusal(editor)).toBeNull();
});
