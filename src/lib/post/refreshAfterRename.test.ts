import { beforeEach, expect, test, vi } from 'vitest';

import { invalidatePostCache } from '$lib/cloudflare.server';
import { updateHTMLIfUnchanged } from '$lib/db/post/html';
import { readYPostTitlesLinkedFrom, readYPostTitlesLinkingTo } from '$lib/db/post/read';
import { _renderYPostHTML } from '../../routes/api/post/read/[title]/+server';
import { refreshAfterRename } from './refreshAfterRename.server';

vi.mock('$lib/cloudflare.server', () => ({ invalidatePostCache: vi.fn() }));
vi.mock('$lib/db/post/html', () => ({ updateHTMLIfUnchanged: vi.fn() }));
vi.mock('$lib/db/post/read', () => ({
	readYPostTitlesLinkedFrom: vi.fn(async () => []),
	readYPostTitlesLinkingTo: vi.fn(async () => []),
}));
vi.mock('../../routes/api/post/read/[title]/+server', () => ({ _renderYPostHTML: vi.fn() }));

const lastUpdated = new Date('2026-11-01');

const rendered = (title: string, html: string | null = `<p>${title}</p>`) => ({
	post: { id: `${title}-id`, lastUpdated },
	html,
	text: title,
	image: undefined,
});

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(readYPostTitlesLinkedFrom).mockResolvedValue([]);
	vi.mocked(readYPostTitlesLinkingTo).mockResolvedValue([]);
	vi.mocked(_renderYPostHTML).mockImplementation(async (title) => rendered(title) as never);
});

test('articles linking to the renamed article get new HTML and their cache purged', async () => {
	vi.mocked(readYPostTitlesLinkingTo).mockResolvedValue([{ title: 'first' }, { title: 'second' }]);

	await refreshAfterRename('renamed');

	expect(readYPostTitlesLinkingTo).toHaveBeenCalledWith('renamed');
	expect(updateHTMLIfUnchanged).toHaveBeenCalledWith('first-id', lastUpdated, {
		content: '<p>first</p>',
		text: 'first',
		image: undefined,
	});
	expect(updateHTMLIfUnchanged).toHaveBeenCalledWith('second-id', lastUpdated, {
		content: '<p>second</p>',
		text: 'second',
		image: undefined,
	});
	expect(invalidatePostCache).toHaveBeenCalledWith('first');
	expect(invalidatePostCache).toHaveBeenCalledWith('second');
});

test('articles the renamed article links to are purged, their backlinks show its title', async () => {
	vi.mocked(readYPostTitlesLinkedFrom).mockResolvedValue([{ title: 'linked' }]);

	await refreshAfterRename('renamed');

	expect(readYPostTitlesLinkedFrom).toHaveBeenCalledWith('renamed');
	expect(invalidatePostCache).toHaveBeenCalledWith('linked');
	expect(_renderYPostHTML).not.toHaveBeenCalled();
});

test('an article that fails to render does not stop the rest', async () => {
	vi.mocked(readYPostTitlesLinkingTo).mockResolvedValue([{ title: 'broken' }, { title: 'fine' }]);
	vi.mocked(_renderYPostHTML).mockRejectedValueOnce(500);
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

	await refreshAfterRename('renamed');

	expect(updateHTMLIfUnchanged).toHaveBeenCalledOnce();
	expect(invalidatePostCache).toHaveBeenCalledWith('fine');
	warn.mockRestore();
});

test('an article without content is only purged', async () => {
	vi.mocked(readYPostTitlesLinkingTo).mockResolvedValue([{ title: 'system' }]);
	vi.mocked(_renderYPostHTML).mockResolvedValueOnce(rendered('system', null) as never);

	await refreshAfterRename('renamed');

	expect(updateHTMLIfUnchanged).not.toHaveBeenCalled();
	expect(invalidatePostCache).toHaveBeenCalledWith('system');
});
