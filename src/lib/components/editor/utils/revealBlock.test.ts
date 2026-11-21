import { afterEach, expect, test, vi } from 'vitest';
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';
import { $getBlockId, buildEditorFromExtensions } from '@lexical/extension';

import { articleExtension } from '../config/article';
import { EDITOR_IS_EDITABLE } from '$lib/constants/constants';
import { revealBlock } from './revealBlock';

afterEach(() => {
	// jsdom has neither, the test adds them.
	delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
	delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
	document.body.replaceChildren();
});

test('the block is scrolled to and outlined, an unknown id does nothing', () => {
	const root = document.createElement('div');
	root.contentEditable = 'true';
	document.body.append(root);

	const editor = buildEditorFromExtensions(articleExtension(null, EDITOR_IS_EDITABLE, null));
	editor.setRootElement(root);
	editor.update(
		() => {
			$getRoot()
				.clear()
				.append(
					$createParagraphNode().append($createTextNode('first')),
					$createParagraphNode().append($createTextNode('second'))
				);
		},
		{ discrete: true }
	);

	const [id, element] = editor.read(() => {
		const second = $getRoot().getLastChildOrThrow();

		return [$getBlockId(second), editor.getElementByKey(second.getKey())];
	});

	const scrollIntoView = vi.fn();
	const animate = vi.fn();
	Object.assign(HTMLElement.prototype, { scrollIntoView, animate });

	expect(revealBlock(editor, id!)).toBe(true);
	expect(scrollIntoView.mock.contexts).toEqual([element]);
	expect(animate.mock.contexts).toEqual([element]);

	expect(revealBlock(editor, 'not-a-block')).toBe(false);
	expect(scrollIntoView).toHaveBeenCalledOnce();

	editor.dispose();
});
