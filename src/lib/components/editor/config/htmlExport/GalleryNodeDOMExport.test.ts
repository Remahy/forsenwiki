import { expect, test } from 'vitest';
import { $createParagraphNode, $getRoot } from 'lexical';
import { buildEditorFromExtensions } from '@lexical/extension';
import { HeadlessExtension } from '@lexical/headless';
import { $generateHtmlFromNodes } from '@lexical/html';

import { articleExtension } from '../article';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';
import { $createGalleryNode } from '../../plugins/Gallery/Gallery';
import { $createImageNode } from '../../plugins/Image/Image';

test('exports the gallery without the editor-only handle', () => {
	const editor = buildEditorFromExtensions(
		HeadlessExtension,
		articleExtension(null, EDITOR_IS_READONLY, null)
	);

	editor.update(
		() => {
			$getRoot().append(
				$createGalleryNode().append(
					$createImageNode({ src: 'data:image/png;base64,AA==', altText: '' }),
					$createImageNode({ src: 'data:image/png;base64,BB==', altText: '' })
				),
				$createParagraphNode()
			);
		},
		{ discrete: true }
	);

	const dom = editor.read(() =>
		new DOMParser().parseFromString($generateHtmlFromNodes(editor, null), 'text/html')
	);

	expect(dom.querySelector('.editor-gallery, .editor-gallery__handle')).toBeNull();
	expect(dom.querySelectorAll('.gallery .embla .embla__slide img')).toHaveLength(2);
});
