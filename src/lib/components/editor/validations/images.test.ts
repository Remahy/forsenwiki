import { expect, test } from 'vitest';
import { $createParagraphNode, $getRoot, type LexicalNode } from 'lexical';
import { $getBlockId, buildEditorFromExtensions } from '@lexical/extension';
import { HeadlessExtension } from '@lexical/headless';

import { articleExtension } from '../config/article';
import { $createGalleryNode } from '../plugins/Gallery/Gallery';
import { $createImageNode, type ImageNode } from '../plugins/Image/Image';
import { EDITOR_IS_EDITABLE } from '$lib/constants/constants';
import { IMAGE_MAX_WIDTH } from '$lib/constants/image';
import { InvalidImagesError } from '$lib/errors/InvalidImages';
import { adjustImages } from './images';

const setup = (build: () => Record<string, LexicalNode>) => {
	const editor = buildEditorFromExtensions(
		HeadlessExtension,
		articleExtension(null, EDITOR_IS_EDITABLE, null)
	);

	let nodes: Record<string, LexicalNode> = {};
	editor.update(() => (nodes = build()), { discrete: true });

	return { editor, nodes };
};

test('every image inserted as base64 or as a link is refused at once, with the blocks holding them', async () => {
	const { editor, nodes } = setup(() => {
		const paragraph = $createParagraphNode().append(
			$createImageNode({ src: 'data:image/png;base64,AA==', altText: '' }),
			$createImageNode({ src: 'data:image/png;base64,BB==', altText: '' })
		);
		const linked = $createImageNode({ src: 'https://example.com/forsen.png', altText: '' });

		$getRoot().append(paragraph, $createGalleryNode().append(linked));

		return { paragraph, linked };
	});

	const ids = editor.read(() =>
		[nodes.paragraph, nodes.linked].map((node) => $getBlockId(node.getLatest()))
	);
	expect(ids).not.toContain(null);

	const refused = await adjustImages(editor).catch((err) => err);

	expect(refused).toBeInstanceOf(InvalidImagesError);
	expect(refused.message).toBe(
		'2 images are encoded base64 strings. An image is inserted as a link. Upload them instead.'
	);
	expect([...refused.blockIds].sort()).toEqual([...ids].sort());
});

test('uploaded images pass, their size kept within the limits', async () => {
	const { editor, nodes } = setup(() => {
		const image = $createImageNode({
			src: 'a'.repeat(64),
			altText: '',
			width: 99_999,
			height: 100,
		});

		$getRoot().append($createParagraphNode().append(image));

		return { image };
	});

	await expect(adjustImages(editor)).resolves.toBe(true);
	expect(editor.read(() => (nodes.image.getLatest() as ImageNode).getWidthAndHeight().width)).toBe(
		IMAGE_MAX_WIDTH
	);
});
