import { beforeEach, expect, test, vi } from 'vitest';
import { $createParagraphNode, $createTextNode, $getRoot, type LexicalNode } from 'lexical';
import { $getBlockId, buildEditorFromExtensions } from '@lexical/extension';
import { HeadlessExtension } from '@lexical/headless';

import { articleExtension } from '../config/article';
import { $createALinkNode } from '$lib/lexical/custom';
import { EDITOR_IS_EDITABLE } from '$lib/constants/constants';
import { checkMissingArticleLinks } from './missingArticleLinks.server';

const deleted = vi.hoisted(() => new Set<string>());

vi.mock('$lib/db/post/read', () => ({
	readMissingYPostIds: vi.fn(async (ids: string[]) => ids.filter((id) => deleted.has(id))),
}));

const internal = (id: string) =>
	$createALinkNode(`/w/${id}`, {}, true, id).append($createTextNode(id));

const setup = () => {
	const editor = buildEditorFromExtensions(
		HeadlessExtension,
		articleExtension(null, EDITOR_IS_EDITABLE, null)
	);

	const blocks: Record<string, LexicalNode> = {};
	editor.update(
		() => {
			blocks.first = $createParagraphNode().append(
				internal('forsen'),
				$createTextNode(' and '),
				internal('gone')
			);
			blocks.second = $createParagraphNode().append(internal('gone'), $createTextNode(' again'));
			blocks.third = $createParagraphNode().append(internal('also-gone'));

			$getRoot().clear().append(blocks.first, blocks.second, blocks.third);
		},
		{ discrete: true }
	);

	const ids = editor.read(() =>
		Object.fromEntries(
			Object.entries(blocks).map(([name, node]) => [name, $getBlockId(node.getLatest())])
		)
	);

	return { editor, ids };
};

beforeEach(() => {
	deleted.clear();
});

test('links whose articles all exist pass', async () => {
	const { editor } = setup();

	await expect(checkMissingArticleLinks(editor, undefined)).resolves.toBeUndefined();
});

test('links to articles that no longer exist refuse the save, with their blocks and articles', async () => {
	deleted.add('gone');
	const { editor, ids } = setup();

	const refused = await checkMissingArticleLinks(editor, undefined).catch((err) => err);

	expect(refused).toMatchObject({
		status: 409,
		body: {
			message:
				'2 links point to articles that no longer exist. Remove them or link them to other articles, or submit again to save anyway.',
			blockLabel: 'link',
			missingArticleIds: ['gone'],
		},
	});
	expect([...refused.body.blockIds].sort()).toEqual([ids.first, ids.second].sort());
});

test('missing articles the writer was shown are kept, a newly missing one is warned about again', async () => {
	deleted.add('gone');
	const { editor } = setup();

	await expect(checkMissingArticleLinks(editor, ['gone'])).resolves.toBeUndefined();

	deleted.add('also-gone');

	await expect(checkMissingArticleLinks(editor, ['gone'])).rejects.toMatchObject({
		status: 409,
		body: { missingArticleIds: ['gone', 'also-gone'] },
	});
});
