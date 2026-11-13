import { beforeEach, expect, test, vi } from 'vitest';
import { $getRoot } from 'lexical';
import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';

import { readYPostUpdatesByTitle } from '$lib/db/post/read';
import initialUpdate from '$lib/worker/initialUpdate';
import { isLegacyUpdate, seedState } from '$lib/y/headless';
import { LEXICAL_Y, YJS13 } from '$lib/y/rows';
import { $paragraph, $write, config, edited, legacyEdit, read } from '$lib/yjs/legacy.fixtures';
import { convertLegacyUpdate } from '$lib/yjs/migrateLegacy';
import { POST } from './+server';

vi.mock('$lib/db/post/read', () => ({ readYPostUpdatesByTitle: vi.fn() }));
vi.mock('$lib/worker/initialUpdate', () => ({ default: vi.fn() }));

const firstRow = legacyEdit($write('stored before the migration'));
const legacy = legacyEdit($write('also stored before the migration'), firstRow);
const seed = convertLegacyUpdate(legacy);
const current = await edited(seed, $write('written by someone else since'));

const newArticle = seedState(config(), $write('forsen'));

const migrate = async (body: { title?: string | null; content: string }) => {
	const response = await POST({
		request: new Request('http://localhost/api/post/legacy-draft', {
			method: 'POST',
			body: JSON.stringify(body),
		}),
		locals: { isBlocked: false },
	} as never);

	const { update } = await response.json();

	return update === null ? null : base64ToUint8Array(update);
};

beforeEach(() => {
	vi.mocked(initialUpdate).mockResolvedValue(uint8ArrayToBase64(newArticle));
	vi.mocked(readYPostUpdatesByTitle).mockResolvedValue({
		postUpdates: [
			{ format: YJS13, content: uint8ArrayToBase64(firstRow) },
			{ format: YJS13, content: uint8ArrayToBase64(legacy) },
			{ format: LEXICAL_Y, content: uint8ArrayToBase64(seed) },
			{ format: LEXICAL_Y, content: uint8ArrayToBase64(current) },
		],
	} as never);
});

test('a draft that only holds an older version of the article changes nothing', async () => {
	expect(await migrate({ title: 'article', content: uint8ArrayToBase64(firstRow) })).toBe(null);
	expect(await migrate({ title: 'article', content: uint8ArrayToBase64(legacy) })).toBe(null);
});

test("a draft's own changes come back as an update of the current article", async () => {
	const draft = legacyEdit(
		() => $getRoot().getFirstChildOrThrow().insertBefore($paragraph('my unsaved paragraph')),
		firstRow
	);

	const update = await migrate({ title: 'article', content: uint8ArrayToBase64(draft) });

	expect(isLegacyUpdate(update as Uint8Array)).toBe(false);
	expect(read(current, update as Uint8Array)).toEqual([
		'my unsaved paragraph',
		'stored before the migration',
		'also stored before the migration',
		'written by someone else since',
	]);
});

test('a draft of a new article comes back as an update of what a new article starts with', async () => {
	const draft = legacyEdit($write('my unsaved article'));

	const update = await migrate({ content: uint8ArrayToBase64(draft) });

	expect(read(newArticle, update as Uint8Array)).toEqual(['my unsaved article']);
});

test('only drafts of the Yjs 13 editor are taken', async () => {
	await expect(
		migrate({ title: 'article', content: uint8ArrayToBase64(current) })
	).rejects.toMatchObject({ status: 400 });
});
