import { afterEach, expect, test, vi } from 'vitest';

import { handleNewFile } from '../editor/utils/handleNewFile';
import { handleNewImage } from '../editor/utils/handleNewImage';
import {
	addFilesToUpload,
	resetUploadContentState,
	uploadContentState,
} from './uploadContentState.svelte.js';

const read = vi.hoisted(() => async (file: File, linkType = 'external') => ({
	linkType,
	file,
	hash: file.name,
	name: file.name,
}));

vi.mock('../editor/utils/handleNewImage', () => ({ handleNewImage: vi.fn(read) }));
vi.mock('../editor/utils/handleNewFile', () => ({ handleNewFile: vi.fn(read) }));
vi.mock('$lib/s3/uploadContentHandlers', () => ({ uploadFiles: vi.fn() }));

afterEach(() => {
	resetUploadContentState();
	vi.clearAllMocks();
});

const file = (name: string, type: string) => new File(['x'], name, { type });

test('images are read as images, other files as files, both with whether a moderator uploads', async () => {
	const image = file('forsen.png', 'image/png');
	const video = file('forsen.mp4', 'video/mp4');

	await addFilesToUpload([image, video], true);

	expect(handleNewImage).toHaveBeenCalledExactlyOnceWith(image, true);
	expect(handleNewFile).toHaveBeenCalledExactlyOnceWith(video, true);
	expect(uploadContentState.content.map(({ name }) => name)).toEqual(['forsen.png', 'forsen.mp4']);
});

test('duplicates and unsupported files are not added', async () => {
	await addFilesToUpload(
		[
			file('forsen.png', 'image/png'),
			file('forsen.png', 'image/png'),
			file('forsen.exe', 'application/x-msdownload'),
		],
		false
	);

	expect(uploadContentState.content.map(({ name }) => name)).toEqual(['forsen.png']);
	expect(uploadContentState.error).toBe('');
});

test('files already uploaded are named in the message instead', async () => {
	vi.mocked(handleNewFile).mockImplementationOnce(async (f) => ({
		linkType: 'internal',
		src: f.name,
		hash: f.name,
		name: 'Forsen speedrun',
	}));

	await addFilesToUpload([file('run.mp4', 'video/mp4')], false);

	expect(uploadContentState.content).toEqual([]);
	expect(uploadContentState.error.trim()).toBe(
		'Video "run.mp4" already exists as "Forsen speedrun".'
	);
});
