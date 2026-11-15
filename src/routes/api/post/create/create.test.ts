import { beforeEach, expect, test, vi } from 'vitest';
import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';

import { createPost } from '$lib/db/post/create';
import { isLegacyUpdate, seedState } from '$lib/y/headless';
import { $write, config, legacyEdit, read } from '$lib/yjs/legacy.fixtures';
import { POST } from './+server';

vi.mock('$lib/db/post/read', () => ({ readYPostByTitle: vi.fn(async () => null) }));
vi.mock('$lib/db/post/create', () => ({ createPost: vi.fn(async () => ({ id: 'post' })) }));
vi.mock('$lib/db/post/html', () => ({ upsertHTML: vi.fn() }));
vi.mock('$lib/worker/toHTML', () => ({ default: vi.fn(async () => ({ html: '', text: '' })) }));
vi.mock('$lib/s3/validateUploads.server', () => ({
	validateUploads: vi.fn(async () => []),
	pruneFailedUploads: vi.fn(),
}));
vi.mock('$lib/components/editor/validations/index.server', () => ({
	serverRunValidations: vi.fn(),
}));

const submit = (update: Uint8Array) =>
	POST({
		request: new Request('http://localhost/api/post/create', {
			method: 'POST',
			body: JSON.stringify({ title: 'Article', content: uint8ArrayToBase64(update) }),
		}),
		locals: {
			isBlocked: false,
			auth: async () => ({ user: { id: 'user', name: 'user' } }),
		},
	} as never);

const stored = () => {
	const [{ data }] = vi.mocked(createPost).mock.calls[0];

	return base64ToUint8Array(data.content);
};

beforeEach(() => {
	vi.mocked(createPost).mockClear();
});

test('an article from the @lexical/y editor is stored', async () => {
	const response = await submit(seedState(config(), $write('typed now')));

	expect(response.status).toBe(200);
	expect(read(stored())).toEqual(['typed now']);
});

test('an article from a tab that still runs the Yjs 13 editor is stored converted', async () => {
	const response = await submit(legacyEdit($write('typed in an old tab')));

	expect(response.status).toBe(200);
	expect(createPost).toHaveBeenCalledOnce();
	expect(isLegacyUpdate(stored())).toBe(false);
	expect(read(stored())).toEqual(['typed in an old tab']);
});
