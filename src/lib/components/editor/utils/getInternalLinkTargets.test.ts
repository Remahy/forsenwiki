import { expect, test } from 'vitest';
import { $createParagraphNode, $createTextNode, $getRoot, type LexicalNode } from 'lexical';
import { $getBlockId, buildEditorFromExtensions } from '@lexical/extension';
import { HeadlessExtension } from '@lexical/headless';

import { articleExtension } from '../config/article';
import { $createALinkNode } from '$lib/lexical/custom';
import { EDITOR_IS_EDITABLE } from '$lib/constants/constants';
import { getInternalLinkTargets } from './getInternalLinkTargets';

const internal = (id: string) =>
	$createALinkNode(`/w/${id}`, {}, true, id).append($createTextNode(id));

test('internal links are grouped by their article, with how many and the blocks holding them', () => {
	const editor = buildEditorFromExtensions(
		HeadlessExtension,
		articleExtension(null, EDITOR_IS_EDITABLE, null)
	);

	const blocks: Record<string, LexicalNode> = {};
	editor.update(
		() => {
			// Text between them, Lexical merges identical links next to each other.
			blocks.first = $createParagraphNode().append(
				internal('forsen'),
				$createTextNode(' and '),
				internal('forsen')
			);
			blocks.second = $createParagraphNode().append(
				internal('forsen'),
				internal('xqc'),
				$createALinkNode('https://example.com').append($createTextNode('example'))
			);

			$getRoot().clear().append(blocks.first, blocks.second);
		},
		{ discrete: true }
	);

	const ids = editor.read(() =>
		Object.fromEntries(
			Object.entries(blocks).map(([name, node]) => [name, $getBlockId(node.getLatest())])
		)
	);

	expect(getInternalLinkTargets(editor)).toEqual(
		new Map([
			['forsen', { links: 3, blockIds: new Set([ids.first, ids.second]) }],
			['xqc', { links: 1, blockIds: new Set([ids.second]) }],
		])
	);
});
