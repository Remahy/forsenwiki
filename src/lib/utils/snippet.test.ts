import { expect, test } from 'vitest';

import { toSnippet } from './snippet';

test('a long text is cut at 150 characters and marked as cut', () => {
	expect(toSnippet('a'.repeat(200))).toBe(`${'a'.repeat(150)}...`);
});

test('a text of 150 characters or fewer is left whole', () => {
	expect(toSnippet('a'.repeat(150))).toBe('a'.repeat(150));
	expect(toSnippet('short')).toBe('short');
});
