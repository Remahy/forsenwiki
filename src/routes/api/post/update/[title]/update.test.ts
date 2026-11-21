import { beforeEach, expect, test, vi } from 'vitest';
import { $getRoot } from 'lexical';
import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';

import { readYPostUpdatesByTitle } from '$lib/db/post/read';
import { updatePost } from '$lib/db/post/update';
import { isLegacyUpdate, seedState } from '$lib/y/headless';
import { ALREADY_MIGRATED_MESSAGE, LEXICAL_Y, STALE_MIGRATION_MESSAGE, YJS13 } from '$lib/y/rows';
import { $paragraph, $write, config, edited, legacyEdit, read } from '$lib/yjs/legacy.fixtures';
import { convertLegacyUpdate } from '$lib/yjs/migrateLegacy';
import { _getYPostByTitle } from '../../read/[title]/+server';
import { POST } from './+server';
import { InvalidArticleError } from '$lib/errors/InvalidArticle';
import { serverRunValidations } from '$lib/components/editor/validations/index.server';
import { checkMissingArticleLinks } from '$lib/components/editor/validations/missingArticleLinks.server';
import { getInternalIds } from '$lib/components/editor/utils/getInternalIds';

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
vi.mock('$lib/components/editor/validations/missingArticleLinks.server', () => ({
	checkMissingArticleLinks: vi.fn(async () => []),
}));
vi.mock('$lib/components/editor/utils/getInternalIds', async (original) => ({
	...(await original<typeof import('$lib/components/editor/utils/getInternalIds')>()),
	getInternalIds: vi.fn(() => []),
}));
vi.mock('../../read/[title]/+server', () => ({ _getYPostByTitle: vi.fn() }));
vi.mock('$lib/db/activity/emit', () => ({ emitActivity: vi.fn() }));

const legacy = legacyEdit($write('stored before the migration'));
const seed = convertLegacyUpdate(legacy);
const current = await edited(seed, $write('written by someone else since'));

const submit = (
	update: Uint8Array,
	{
		forced = undefined as boolean | undefined,
		isModerator = false,
		allowMissingArticles = undefined as string[] | undefined,
	} = {}
) =>
	POST({
		request: new Request('http://localhost/api/post/update/article', {
			method: 'POST',
			body: JSON.stringify({ content: uint8ArrayToBase64(update), forced, allowMissingArticles }),
		}),
		params: { title: 'article' },
		locals: {
			isBlocked: false,
			isModerator,
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
		legacyUpdate: null,
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

const notConverted = () =>
	vi.mocked(_getYPostByTitle).mockResolvedValue({
		id: 'post',
		title: 'article',
		rawTitle: 'Article',
		outRelations: [],
		originalAuthorId: 'user',
		update: null,
		legacyUpdate: uint8ArrayToBase64(legacy),
	} as never);

test('only a moderator who loaded a forced migration reads an article that is not converted', async () => {
	await expect(
		submit(await edited(current, $write('typed now')), { forced: true })
	).rejects.toMatchObject({ status: 409 });
	expect(_getYPostByTitle).toHaveBeenLastCalledWith('article', { allowUnconverted: false });

	await submit(await edited(current, $write('typed now')), { isModerator: true });
	expect(_getYPostByTitle).toHaveBeenLastCalledWith('article', { allowUnconverted: false });

	notConverted();

	await submit(await edited(seed, $write('fixed by a moderator')), {
		forced: true,
		isModerator: true,
	});
	expect(_getYPostByTitle).toHaveBeenLastCalledWith('article', { allowUnconverted: true });
});

test("a moderator's version of a forced migration is stored after the seed it is built on", async () => {
	notConverted();

	const response = await submit(await edited(seed, $write('fixed by a moderator')), {
		forced: true,
		isModerator: true,
	});

	expect(response.status).toBe(200);
	expect(updatePost).toHaveBeenCalledOnce();

	const [{ content, seed: storedSeed }, metadata] = vi.mocked(updatePost).mock.calls[0];
	const row = base64ToUint8Array(content);

	expect(storedSeed).toEqual({ content: uint8ArrayToBase64(seed), byteLength: seed.byteLength });
	expect(read(seed)).toEqual(['stored before the migration']);
	expect(read(seed, row)).toEqual(['stored before the migration', 'fixed by a moderator']);
	expect(metadata.byteLength).toBe(row.byteLength);
	expect(metadata.byteLength).toBeLessThan(seed.byteLength);
});

test('a forced migration that is submitted unchanged migrates the article as it is', async () => {
	notConverted();

	const response = await submit(seed, { forced: true, isModerator: true });

	expect(response.status).toBe(200);

	const [{ content, seed: storedSeed }] = vi.mocked(updatePost).mock.calls[0];

	expect(storedSeed?.content).toBe(uint8ArrayToBase64(seed));
	expect(read(seed, base64ToUint8Array(content))).toEqual(['stored before the migration']);
});

test('a version that is not built on the forced migration is refused', async () => {
	notConverted();

	const other = seedState(config(), $write('written from scratch'));

	await expect(submit(other, { forced: true, isModerator: true })).rejects.toMatchObject({
		status: 409,
		body: { message: STALE_MIGRATION_MESSAGE },
	});
	expect(updatePost).not.toHaveBeenCalled();
});

test('a forced migration of an article that got converted in the meantime is refused', async () => {
	await expect(
		submit(await edited(seed, $write('fixed by a moderator')), { forced: true, isModerator: true })
	).rejects.toMatchObject({ status: 409, body: { message: ALREADY_MIGRATED_MESSAGE } });
	expect(updatePost).not.toHaveBeenCalled();
});

test('an article that is converted stores no seed', async () => {
	await submit(await edited(current, $write('typed now')), { isModerator: true });

	expect(vi.mocked(updatePost).mock.calls[0][0].seed).toBeUndefined();
});

test('images that are base64 or links refuse the save with the blocks holding them', async () => {
	vi.mocked(serverRunValidations).mockRejectedValueOnce(
		new InvalidArticleError('An image is inserted as a link. Upload it instead.', {
			blockIds: ['block'],
			blockLabel: 'image',
		})
	);

	await expect(submit(await edited(current, $write('typed now')))).rejects.toMatchObject({
		status: 400,
		body: {
			message: 'An image is inserted as a link. Upload it instead.',
			blockIds: ['block'],
			blockLabel: 'image',
		},
	});
});

test('the missing articles a writer was shown are passed on to keep their links', async () => {
	await submit(await edited(current, $write('typed now')), { allowMissingArticles: ['gone'] });

	expect(checkMissingArticleLinks).toHaveBeenCalledWith(expect.anything(), ['gone']);
});

test('links kept to articles that no longer exist are not related to them, and the update says so', async () => {
	vi.mocked(getInternalIds).mockReturnValueOnce(['forsen', 'deleted']);
	vi.mocked(checkMissingArticleLinks).mockResolvedValueOnce(['deleted']);

	const response = await submit(await edited(current, $write('typed now')), {
		allowMissingArticles: ['deleted'],
	});

	expect(response.status).toBe(200);
	const [body] = vi.mocked(updatePost).mock.calls[0];
	expect(body.outRelations).toEqual([{ isSystem: false, toPostId: 'forsen' }]);
	expect(body.missingArticles).toEqual(['deleted']);
});
