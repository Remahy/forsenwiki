import { afterEach, expect, test, vi } from 'vitest';

import { confirmUploads, deleteContent } from '$lib/api/content';
import { addNewUploaded } from '$lib/components/uploadingContentModalGlobals.svelte.js';
import { uploadFiles } from './uploadContentHandlers';

vi.mock('$lib/api/content', () => ({
	uploadContent: vi.fn(async () => ({
		status: 200,
		json: async () =>
			['accepted', 'refused'].map((id, index) => ({
				index,
				url: `https://storage.example/${id}`,
				contentType: 'image/png',
				name: `${id}.png`,
				metadata: { id },
			})),
	})),
	confirmUploads: vi.fn(async () => ({ ok: true })),
	deleteContent: vi.fn(async () => ({ ok: true })),
}));
vi.mock('$lib/components/uploadingContentModalGlobals.svelte.js', () => ({
	addNewUploaded: vi.fn(),
	setUploading: vi.fn(),
}));
vi.mock('$lib/utils/indexedDb/content', () => ({ loadContent: vi.fn() }));

afterEach(() => {
	vi.unstubAllGlobals();
	vi.clearAllMocks();
});

const file = (name: string) => ({
	name,
	mimetype: 'image/png',
	contentLength: 1,
	hash: 'a'.repeat(64),
	fileSnippet: 'AA==',
	file: new File(['x'], name),
});

test('a file storage refuses is deleted again, not confirmed or listed as uploaded', async () => {
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string) =>
			url.endsWith('/refused')
				? { ok: false, status: 403, statusText: 'Forbidden' }
				: { ok: true, status: 200, statusText: 'OK' }
		)
	);

	await expect(uploadFiles([file('accepted.png'), file('refused.png')])).rejects.toThrow();

	expect(deleteContent).toHaveBeenCalledExactlyOnceWith('refused');
	expect(confirmUploads).toHaveBeenCalledExactlyOnceWith(['accepted']);
	expect(addNewUploaded).toHaveBeenCalledExactlyOnceWith(
		expect.objectContaining({ id: 'accepted' })
	);
});
