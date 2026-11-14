import { beforeEach, expect, test, vi } from 'vitest';
import { $getRoot } from 'lexical';
import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';

import { readYPostUpdatesByTitle } from '$lib/db/post/read';
import { updatePost } from '$lib/db/post/update';
import { isLegacyUpdate } from '$lib/y/headless';
import { LEXICAL_Y, YJS13 } from '$lib/y/rows';
import { $paragraph, $write, edited, legacyEdit, read } from '$lib/yjs/legacy.fixtures';
import { convertLegacyUpdate } from '$lib/yjs/migrateLegacy';
import { _getYPostByTitle } from '../../read/[title]/+server';
import { POST } from './+server';

vi.mock('$lib/db/post/read', () => ({
	readSystemYPostRelations: vi.fn(async () => []),
	readYPostByTitle: vi.fn(async () => null),
	readYPostUpdatesByTitle: vi.fn(),
}));
vi.mock('$lib/db/post/update', () => ({
	updatePost: vi.fn(async () => ({ id: 'post-update', createdTimestamp: new Date() })),
	updatePostTitle: vi.fn(),
}));
vi.mock('$lib/db/post/html', () => ({ upsertHTML: vi.fn() }));
vi.mock('$lib/cloudflare.server', () => ({ invalidatePostCache: vi.fn() }));
vi.mock('$lib/worker/toHTML', () => ({ default: vi.fn(async () => ({ html: '', text: '' })) }));
vi.mock('$lib/worker/initialUpdate', () => ({ default: vi.fn() }));
vi.mock('$lib/s3/validateUploads.server', () => ({
	validateUploads: vi.fn(async () => []),
	pruneFailedUploads: vi.fn(),
}));
vi.mock('$lib/components/editor/validations/index.server', () => ({
	serverRunValidations: vi.fn(),
}));
vi.mock('../../read/[title]/+server', () => ({ _getYPostByTitle: vi.fn() }));
vi.mock('../../../adonis/frontpage/+server', () => ({ _emit: vi.fn() }));

const legacy = legacyEdit($write('stored before the migration'));
const seed = convertLegacyUpdate(legacy);
const current = await edited(seed, $write('written by someone else since'));

const submit = (update: Uint8Array) =>
	POST({
		request: new Request('http://localhost/api/post/update/article', {
			method: 'POST',
			body: JSON.stringify({ content: uint8ArrayToBase64(update) }),
		}),
		params: { title: 'article' },
		locals: {
			isBlocked: false,
			isModerator: false,
			auth: async () => ({ user: { id: 'user', name: 'user' } }),
		},
	} as never);

const stored = () => {
	const [{ content }] = vi.mocked(updatePost).mock.calls[0];

	return { row: base64ToUint8Array(content), article: read(current, base64ToUint8Array(content)) };
};

beforeEach(() => {
	vi.mocked(updatePost).mockClear();
	vi.mocked(_getYPostByTitle).mockResolvedValue({
		id: 'post',
		title: 'article',
		rawTitle: 'Article',
		outRelations: [],
		originalAuthorId: 'user',
		update: uint8ArrayToBase64(current),
	} as never);
	vi.mocked(readYPostUpdatesByTitle).mockResolvedValue({
		postUpdates: [
			{ format: YJS13, content: uint8ArrayToBase64(legacy) },
			{ format: LEXICAL_Y, content: uint8ArrayToBase64(seed) },
			{ format: LEXICAL_Y, content: uint8ArrayToBase64(current) },
		],
	} as never);
});

test('an update from the @lexical/y editor is stored', async () => {
	const response = await submit(await edited(current, $write('typed now')));

	expect(response.status).toBe(200);
	expect(stored().article).toEqual([
		'stored before the migration',
		'written by someone else since',
		'typed now',
	]);
});

test('an update from a tab that still runs the Yjs 13 editor is merged into the article', async () => {
	const response = await submit(
		legacyEdit(
			() => $getRoot().getFirstChildOrThrow().insertBefore($paragraph('typed in an old tab')),
			legacy
		)
	);

	expect(response.status).toBe(200);
	expect(updatePost).toHaveBeenCalledOnce();
	expect(isLegacyUpdate(stored().row)).toBe(false);
	expect(stored().article).toEqual([
		'typed in an old tab',
		'stored before the migration',
		'written by someone else since',
	]);
});

test('an unchanged document from the Yjs 13 editor leaves the article as it is', async () => {
	const response = await submit(legacy);

	expect(response.status).toBe(200);
	expect(isLegacyUpdate(stored().row)).toBe(false);
	expect(stored().article).toEqual([
		'stored before the migration',
		'written by someone else since',
	]);
});
