import { expect, test, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { writable } from 'svelte/store';
import { createEditor } from 'lexical';

import { articleConfig } from '../../../config/article';
import TablePlugin from './TablePlugin.svelte';

test('unregisters everything when unmounted', () => {
	const editor = createEditor(articleConfig(null, true, null));
	const unregisters: Array<ReturnType<typeof vi.fn>> = [];

	for (const method of [
		'registerCommand',
		'registerNodeTransform',
		'registerUpdateListener',
	] as const) {
		const original = editor[method].bind(editor) as (...args: unknown[]) => () => void;
		vi.spyOn(editor, method).mockImplementation((...args: unknown[]) => {
			const unregister = vi.fn(original(...args));
			unregisters.push(unregister);
			return unregister as never;
		});
	}

	const component = mount(TablePlugin, {
		target: document.body,
		context: new Map([['COMPOSER', writable({ getEditor: () => editor })]]),
	});
	flushSync();
	expect(unregisters.length).toBeGreaterThan(0);

	unmount(component);
	for (const unregister of unregisters) {
		expect(unregister).toHaveBeenCalledOnce();
	}
});
