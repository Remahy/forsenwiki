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

const render = (blocks: ErrorBlock[]) => {
	const editor = {} as never;
	component = mount(ShowBlocksButton, { target: document.body, props: { editor, blocks } });

	const button = document.body.querySelector('button')!;
	const text = () => button.textContent?.replace(/\s+/g, ' ').trim();
	const click = () => {
		button.click();
		flushSync();
	};

	return { editor, text, click };
};

test('one block is shown on every click', () => {
	const { editor, text, click } = render([{ id: 'one', label: 'image' }]);

	expect(text()).toBe('Show image');

	click();
	click();

	expect(vi.mocked(revealBlock).mock.calls).toEqual([
		[editor, 'one'],
		[editor, 'one'],
	]);
});

test('several blocks are shown in turn, the label naming the block the next click shows', () => {
	const { editor, text, click } = render([
		{ id: 'one', label: 'link' },
		{ id: 'two', label: 'image' },
		{ id: 'three', label: 'link' },
	]);

	expect(text()).toBe('Show link 1 of 3');

	click();
	expect(text()).toBe('Show image 2 of 3');

	click();
	expect(text()).toBe('Show link 3 of 3');

	click();
	expect(text()).toBe('Show link 1 of 3');

	expect(vi.mocked(revealBlock).mock.calls.map(([, id]) => id)).toEqual(['one', 'two', 'three']);
	expect(vi.mocked(revealBlock).mock.calls.every(([used]) => used === editor)).toBe(true);
});
