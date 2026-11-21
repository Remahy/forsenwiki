import { expect, test } from 'vitest';
import { $createParagraphNode, $createTextNode, $getRoot, type LexicalNode } from 'lexical';
import { $getBlockId, buildEditorFromExtensions } from '@lexical/extension';
import { HeadlessExtension } from '@lexical/headless';

import { articleExtension } from '../config/article';
import { $createGalleryNode } from '../plugins/Gallery/Gallery';
import { $createImageNode } from '../plugins/Image/Image';
import { EDITOR_IS_EDITABLE } from '$lib/constants/constants';
import { getImageBlockIds } from './getImageBlockIds';

const failed = 'a'.repeat(64);
const uploaded = 'b'.repeat(64);

test('a failed image is found by its own block, or the block around it, wherever it is used', () => {
	const editor = buildEditorFromExtensions(
		HeadlessExtension,
		articleExtension(null, EDITOR_IS_EDITABLE, null)
	);

	const blocks: Record<string, LexicalNode> = {};
	editor.update(
		() => {
			blocks.inline = $createParagraphNode().append(
				$createTextNode('before '),
				$createImageNode({ src: failed, altText: '' })
			);
			blocks.fine = $createParagraphNode().append($createImageNode({ src: uploaded, altText: '' }));
			blocks.galleryImage = $createImageNode({ src: failed, altText: '' });

			$getRoot().append(
				blocks.inline,
				blocks.fine,
				$createGalleryNode().append(blocks.galleryImage)
			);
		},
		{ discrete: true }
	);

	const ids = editor.read(() =>
		Object.fromEntries(
			Object.entries(blocks).map(([name, node]) => [name, $getBlockId(node.getLatest())])
		)
	);

	expect(Object.values(ids)).not.toContain(null);
	expect(getImageBlockIds(editor, [failed])).toEqual([ids.inline, ids.galleryImage]);
	expect(getImageBlockIds(editor, [uploaded])).toEqual([ids.fine]);
	expect(getImageBlockIds(editor, [])).toEqual([]);
});
