import { expect, test } from 'vitest';
import { buildEditorFromExtensions, getExtensionDependencyFromEditor } from '@lexical/extension';
import { HeadlessExtension } from '@lexical/headless';
import { createYCollabConfig, createYDoc, describeStorage, YCollabExtension } from '@lexical/y';

import { yCollabInput } from '$lib/y/config';
import { EDITOR_IS_EDITABLE } from '$lib/constants/constants';
import { articleExtension } from './article';

// How @lexical/y stores each node type. The kind is pinned in every document on its first
// write, so changing one of these means reseeding every article.
const expected = {
	paragraph: 'line',
	heading: 'line',
	quote: 'line',
	listitem: 'line',
	'a-heading': 'line',
	list: 'group',
	'a-link': 'format',
	'float-block': 'nested',
	gallery: 'nested',
	'a-table': 'nested',
	tablecell: 'nested',
	tablerow: 'nested',
	'a-tablecell': 'nested',
	image: 'nested',
	videoembed: 'nested',
	fallback: 'nested',
	youtube: 'nested',
};

test('article node types are stored as intended', () => {
	const editor = buildEditorFromExtensions(
		HeadlessExtension,
		articleExtension(null, EDITOR_IS_EDITABLE, null)
	);

	const kinds = describeStorage(editor);

	expect(kinds).toMatchObject(expected);
	editor.dispose();
});

test('the binding becomes active on a new document', () => {
	const doc = createYDoc();
	const editor = buildEditorFromExtensions(
		HeadlessExtension,
		articleExtension(null, EDITOR_IS_EDITABLE, null),
		createYCollabConfig(yCollabInput(doc, { synced: true }))
	);
	const { status } = getExtensionDependencyFromEditor(editor, YCollabExtension).output;

	expect(status.value).toBe('active');
	editor.dispose();
	doc.destroy();
});
