import { afterEach, expect, test } from 'vitest';
import { mount, unmount } from 'svelte';

import EditorError from './EditorError.svelte';

let component: ReturnType<typeof mount> | undefined;

afterEach(() => {
	if (component) {
		unmount(component);
	}
	document.body.replaceChildren();
});

const render = (error: EditorErrorValue, editor?: LexicalEditor) => {
	component = mount(EditorError, { target: document.body, props: { error, editor } });

	return {
		text: document.body.querySelector('p')?.textContent?.replace(/\s+/g, ' ').trim(),
		button: document.body.querySelector('button'),
	};
};

test('a failed save shows its status, message, and a way to the blocks it is about', () => {
	const { text, button } = render(
		Object.assign(new Error("An image in this article doesn't exist."), {
			status: 400,
			statusText: 'Bad Request',
			blocks: [{ id: 'block', label: 'image' }],
		}),
		{} as LexicalEditor
	);

	expect(text).toBe("(400 Bad Request) An image in this article doesn't exist.");
	expect(button?.textContent?.trim()).toBe('Show image');
});

test('a thrown error shows only its message, and no blocks without an editor', () => {
	const { text, button } = render(
		Object.assign(new Error('Network down'), { blocks: [{ id: 'block', label: 'image' }] })
	);

	expect(text).toBe('Network down');
	expect(button).toBeNull();
});
