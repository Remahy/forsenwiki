import { beforeEach, expect, test, vi } from 'vitest';
import { uint8ArrayToBase64 } from 'uint8array-extras';

import { readYPostByTitle, readYPostUpdatesByTitle } from '$lib/db/post/read';
import { updateToHTML } from '$lib/lexical/updateToHTML';
import { LEXICAL_Y, NOT_CONVERTED_MESSAGE, YJS13 } from '$lib/y/rows';
import { $write, edited, legacyEdit, read } from '$lib/yjs/legacy.fixtures';
import { convertLegacyUpdate } from '$lib/yjs/migrateLegacy';
import { load as loadEditPage } from '../../../../w/[title]/edit/+page.server';
import { _getYPostByTitle, _getYPostHTML } from './+server';

vi.mock('$lib/db/post/read', () => ({
	readYPostByTitle: vi.fn(async () => null),
	readYPostUpdatesByTitle: vi.fn(),
	readYPostsByIds: vi.fn(),
}));
vi.mock('$lib/db/post/html', () => ({ upsertHTML: vi.fn() }));
vi.mock('$lib/lexical/updateToHTML', () => ({
	updateToHTML: vi.fn(async () => ({ html: '<p>rendered</p>', text: 'rendered', image: null })),
}));
vi.mock('$lib/prisma.server', () => ({ default: {} }));

const firstRow = legacyEdit($write('stored before the migration'));
const legacy = legacyEdit($write('also stored before the migration'), firstRow);
const seed = convertLegacyUpdate(legacy);
const current = await edited(seed, $write('written since'));

const row = (format: string, update: Uint8Array | null) => ({
	format,
	content: update ? uint8ArrayToBase64(update) : '',
	metadata: { userId: 'author' },
});

const legacyRows = [row(YJS13, firstRow), row(YJS13, legacy)];

const stored = (postUpdates: ReturnType<typeof row>[]) =>
	vi.mocked(readYPostUpdatesByTitle).mockResolvedValue({
		id: 'post',
		title: 'article',
		rawTitle: 'Article',
		outRelations: [],
		postUpdates,
	} as never);

beforeEach(() => {
	vi.mocked(updateToHTML).mockClear();
});

test('an article that is not converted cannot be opened for editing, and says why', async () => {
	stored(legacyRows);

	await expect(_getYPostByTitle('article')).rejects.toMatchObject({
		status: 503,
		body: { message: NOT_CONVERTED_MESSAGE },
	});
	await expect(loadEditPage({ params: { title: 'article' } } as never)).rejects.toMatchObject({
		status: 503,
		body: { message: NOT_CONVERTED_MESSAGE },
	});
});

test('an article that is not converted is still rendered, from its Yjs 13 rows', async () => {
	stored(legacyRows);

	const { html, post } = await _getYPostHTML('article', true);

	expect(html).toBe('<p>rendered</p>');
	expect(post).not.toHaveProperty('postUpdates');

	const [update, format] = vi.mocked(updateToHTML).mock.calls[0];

	expect(format).toBe(YJS13);
	expect(update).toBe(uint8ArrayToBase64(legacy));
});

test('a converted article is read from its @lexical/y rows only', async () => {
	stored([...legacyRows, row(LEXICAL_Y, seed), row(LEXICAL_Y, current)]);

	const { update, originalAuthorId } = await _getYPostByTitle('article');

	expect(originalAuthorId).toBe('author');
	expect(read(new Uint8Array(Buffer.from(update as string, 'base64')))).toEqual([
		'stored before the migration',
		'also stored before the migration',
		'written since',
	]);

	await _getYPostHTML('article', true);

	expect(vi.mocked(updateToHTML).mock.calls[0]).toEqual([update, LEXICAL_Y]);
});

test('a system post without content is neither refused nor rendered', async () => {
	stored([row(YJS13, null)]);

	expect(await _getYPostByTitle('article')).toMatchObject({ update: null });
	expect(await _getYPostHTML('article', true)).toMatchObject({ html: null });
	expect(updateToHTML).not.toHaveBeenCalled();
});

test('a missing article is a 404', async () => {
	vi.mocked(readYPostUpdatesByTitle).mockResolvedValue(null);

	await expect(_getYPostByTitle('article')).rejects.toBe(404);
});

test('the stored HTML is served without reading the rows', async () => {
	vi.mocked(readYPostByTitle).mockResolvedValueOnce({
		title: 'article',
		html: { content: '<p>stored</p>', text: 'stored', image: null },
	} as never);

	expect(await _getYPostHTML('article')).toMatchObject({ html: '<p>stored</p>' });
	expect(updateToHTML).not.toHaveBeenCalled();
});
