import { afterEach, expect, test, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';

import ShowBlocksButton from './ShowBlocksButton.svelte';
import { revealBlock } from './utils/revealBlock';

vi.mock('./utils/revealBlock', () => ({ revealBlock: vi.fn(() => true) }));

let component: ReturnType<typeof mount> | undefined;

afterEach(() => {
	if (component) {
		unmount(component);
	}
	document.body.replaceChildren();
	vi.mocked(revealBlock).mockClear();
});

const render = (blockIds: string[]) => {
	const editor = {} as never;
	component = mount(ShowBlocksButton, {
		target: document.body,
		props: { editor, blockIds, label: 'image' },
	});

	const button = document.body.querySelector('button')!;
	const click = () => {
		button.click();
		flushSync();
	};

	return { editor, button, click };
};

test('one block is shown on every click', () => {
	const { editor, button, click } = render(['one']);

	expect(button.textContent?.trim()).toBe('Show image');

	click();
	click();

	expect(vi.mocked(revealBlock).mock.calls).toEqual([
		[editor, 'one'],
		[editor, 'one'],
	]);
});

test('several blocks are shown in turn, the label naming the one the next click shows', () => {
	const { editor, button, click } = render(['one', 'two', 'three']);

	expect(button.textContent?.replace(/\s+/g, ' ').trim()).toBe('Show image 1 of 3');

	click();
	expect(button.textContent?.replace(/\s+/g, ' ').trim()).toBe('Show image 2 of 3');

	click();
	click();
	click();

	expect(vi.mocked(revealBlock).mock.calls.map(([, id]) => id)).toEqual([
		'one',
		'two',
		'three',
		'one',
	]);
	expect(vi.mocked(revealBlock).mock.calls.every(([used]) => used === editor)).toBe(true);
});
