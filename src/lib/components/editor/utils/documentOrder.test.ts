import { expect, test } from 'vitest';
import { $createParagraphNode, $createTextNode, $getRoot, type LexicalNode } from 'lexical';
import { $getBlockId, buildEditorFromExtensions } from '@lexical/extension';
import { HeadlessExtension } from '@lexical/headless';
import { $createListItemNode, $createListNode } from '@lexical/list';

import { articleExtension } from '../config/article';
import { $createGalleryNode } from '../plugins/Gallery/Gallery';
import { $createImageNode } from '../plugins/Image/Image';
import { EDITOR_IS_EDITABLE } from '$lib/constants/constants';
import { sortBlockIds } from './documentOrder';

test('blocks are sorted as they are in the article, outer before inner, unknown ones last', () => {
	const editor = buildEditorFromExtensions(
		HeadlessExtension,
		articleExtension(null, EDITOR_IS_EDITABLE, null)
	);

	const blocks: Record<string, LexicalNode> = {};
	editor.update(
		() => {
			blocks.paragraph = $createParagraphNode().append($createTextNode('first'));
			blocks.item = $createListItemNode().append($createTextNode('item'));
			blocks.list = $createListNode('bullet').append(blocks.item);
			blocks.image = $createImageNode({ src: 'a'.repeat(64), altText: '' });
			blocks.gallery = $createGalleryNode().append(blocks.image);

			$getRoot().clear().append(blocks.paragraph, blocks.list, blocks.gallery);
		},
		{ discrete: true }
	);

	const id = editor.read(() =>
		Object.fromEntries(
			Object.entries(blocks).map(([name, node]) => [name, $getBlockId(node.getLatest())!])
		)
	);
	expect(Object.values(id)).not.toContain(null);

	expect(
		sortBlockIds(editor, ['unknown', id.image, id.item, id.gallery, id.paragraph, id.list])
	).toEqual([id.paragraph, id.list, id.item, id.gallery, id.image, 'unknown']);
});
