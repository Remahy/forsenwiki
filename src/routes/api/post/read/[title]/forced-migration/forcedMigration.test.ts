import { expect, test, vi } from 'vitest';
import { $createTextNode, $getRoot } from 'lexical';
import { $createListItemNode, $createListNode } from '@lexical/list';
import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';

import { readYPostUpdatesByTitle } from '$lib/db/post/read';
import { ALREADY_MIGRATED_MESSAGE, LEXICAL_Y, YJS13 } from '$lib/y/rows';
import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor';
import { $paragraph, config, read } from '$lib/yjs/legacy.fixtures';
import { convertLegacyUpdate } from '$lib/yjs/migrateLegacy';
import { createNewYDoc, encodeYDocToUpdateV2 } from '$lib/yjs/utils';
import { GET } from './+server';

vi.mock('$lib/db/post/read', () => ({
	readYPostByTitle: vi.fn(),
	readYPostUpdatesByTitle: vi.fn(),
	readYPostsByIds: vi.fn(),
}));
vi.mock('$lib/db/post/html', () => ({ upsertHTML: vi.fn() }));
vi.mock('$lib/lexical/updateToHTML', () => ({ updateToHTML: vi.fn() }));

/**
 * This is not a bug that can happen because of normalizations.
 * This is here to simulate an article that can't be migrated.
 */
const unconvertible = () => {
	const { editor, doc } = getYjsAndEditor(config(), encodeYDocToUpdateV2(createNewYDoc()));

	editor.update(
		() => {
			$getRoot().append(
				$paragraph('written with the old editor'),
				$createListNode('bullet').append(
					$createListItemNode().append($createTextNode('a list item')),
					$createListNode('bullet')
				)
			);
		},
		{ discrete: true, skipTransforms: true }
	);

	return encodeYDocToUpdateV2(doc);
};

const legacy = unconvertible();

const row = (format: string, update: Uint8Array) => ({
	format,
	content: uint8ArrayToBase64(update),
	metadata: { userId: 'author' },
});

const stored = (...postUpdates: ReturnType<typeof row>[]) =>
	vi.mocked(readYPostUpdatesByTitle).mockResolvedValue({
		id: 'post',
		title: 'article',
		rawTitle: 'Article',
		outRelations: [],
		postUpdates,
	} as never);

const load = (isModerator: boolean) =>
	GET({ params: { title: 'article' }, locals: { isModerator } } as never);

test('a moderator gets what the article converts to, with what the conversion loses', async () => {
	stored(row(YJS13, legacy));

	const response = await load(true);
	const { update, differences } = await response.json();

	expect(differences).toEqual(['/root[1]/list: 2 -> 1 children']);
	expect(update).toBe(uint8ArrayToBase64(convertLegacyUpdate(legacy)));
	expect(read(base64ToUint8Array(update))).toEqual(['written with the old editor', 'a list item']);
});

test('the same migration is given every time, so a draft built on it stays valid', async () => {
	stored(row(YJS13, legacy));

	const first = await (await load(true)).json();
	const second = await (await load(true)).json();

	expect(second.update).toBe(first.update);
});

test('only moderators get a forced migration', async () => {
	stored(row(YJS13, legacy));

	await expect(load(false)).rejects.toMatchObject({ status: 401 });
});

test('an article that is converted has no forced migration', async () => {
	stored(row(YJS13, legacy), row(LEXICAL_Y, convertLegacyUpdate(legacy)));

	await expect(load(true)).rejects.toMatchObject({
		status: 409,
		body: { message: ALREADY_MIGRATED_MESSAGE },
	});
});

test('a missing article is a 404', async () => {
	vi.mocked(readYPostUpdatesByTitle).mockResolvedValue(null);

	await expect(load(true)).rejects.toMatchObject({ status: 404 });
});
