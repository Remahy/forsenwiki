import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { invalidatePostCache } from './cloudflare.server';

vi.mock('$env/static/private', () => ({
	CLOUDFLARE_API_TOKEN: 'token',
	CLOUDFLARE_ZONE_ID: 'zone',
}));
vi.mock('$lib/environment/environment', () => ({ DOMAIN: 'https://forsen.wiki' }));

const fetchMock = vi.fn();

const purged = () =>
	fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body).files as string[]);

beforeEach(() => {
	fetchMock.mockReset().mockResolvedValue(Response.json({ success: true }));
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

test('the article and its editor are purged, with the data client navigations ask for', async () => {
	await invalidatePostCache(['forsen']);

	expect(fetchMock).toHaveBeenCalledOnce();
	expect(fetchMock.mock.calls[0][0]).toBe(
		'https://api.cloudflare.com/client/v4/zones/zone/purge_cache'
	);
	expect(purged()).toEqual([
		[
			'https://forsen.wiki/w/forsen',
			'https://forsen.wiki/w/forsen/__data.json?x-sveltekit-invalidated=01',
			'https://forsen.wiki/w/forsen/__data.json?x-sveltekit-invalidated=11',
			'https://forsen.wiki/w/forsen/edit',
			'https://forsen.wiki/w/forsen/edit/__data.json?x-sveltekit-invalidated=01',
			'https://forsen.wiki/w/forsen/edit/__data.json?x-sveltekit-invalidated=11',
		],
	]);
});

test('many articles are purged in as few requests as Cloudflare accepts', async () => {
	const titles = Array.from({ length: 12 }, (_, index) => `article_${index}`);

	await invalidatePostCache(titles);

	const requests = purged();
	expect(requests.map((files) => files.length)).toEqual([30, 30, 12]);
	expect(requests.flat()).toHaveLength(new Set(requests.flat()).size);
	expect(requests.flat()).toContain('https://forsen.wiki/w/article_11/edit');
});

test('a title given twice, or none, purges each article once', async () => {
	await invalidatePostCache(['forsen', 'forsen', '']);

	expect(purged()).toEqual([expect.arrayContaining(['https://forsen.wiki/w/forsen'])]);
	expect(purged()[0]).toHaveLength(6);
});

test('nothing is sent without titles', async () => {
	await invalidatePostCache([]);

	expect(fetchMock).not.toHaveBeenCalled();
});

test('a purge Cloudflare refuses is logged, and the rest are still sent', async () => {
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	fetchMock.mockResolvedValueOnce(
		Response.json(
			{ success: false, errors: [{ code: 1134, message: 'Rate limited' }] },
			{ status: 429 }
		)
	);

	await invalidatePostCache(Array.from({ length: 6 }, (_, index) => `article_${index}`));

	expect(fetchMock).toHaveBeenCalledTimes(2);
	expect(warn).toHaveBeenCalledWith(
		'Cloudflare cache purge failed (429):',
		expect.stringContaining('Rate limited')
	);
	warn.mockRestore();
});

test('a failed request is logged without throwing', async () => {
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));

	await expect(invalidatePostCache(['forsen'])).resolves.toBeUndefined();
	expect(warn).toHaveBeenCalledWith(expect.any(TypeError));
	warn.mockRestore();
});
