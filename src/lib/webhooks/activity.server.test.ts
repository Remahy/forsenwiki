import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import type { ActivityEntry } from '$lib/db/activity/read';
import { sendActivityWebhooks } from './activity.server';

const env = vi.hoisted(() => ({}) as Record<string, string | undefined>);

vi.mock('$env/dynamic/private', () => ({ env }));
vi.mock('$lib/environment/environment', () => ({ DOMAIN: 'https://forsen.wiki' }));

const activity = {
	id: 'a1',
	type: 'USER_REGISTER',
	explanation: null,
	createdTimestamp: '2026-11-15T20:00:00.000Z',
	user: { id: 'u1', name: 'forsen' },
	post: null,
	postUpdate: { id: 'v1', byteLength: 5n, newTitle: null, oldTitle: null },
	content: null,
	oldName: null,
	newName: null,
	oldTags: [],
	newTags: [],
	children: [],
} as unknown as ActivityEntry;

const fetchMock = vi.fn();

beforeEach(() => {
	vi.stubGlobal('fetch', fetchMock);
	fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 204 }));
	delete env.ACTIVITY_WEBHOOK_URLS;
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

const bodies = () => fetchMock.mock.calls.map(([url, init]) => [url, JSON.parse(init.body)]);

test('nothing is sent without configured webhooks', async () => {
	await sendActivityWebhooks([activity]);

	expect(fetchMock).not.toHaveBeenCalled();
});

test('Discord gets embeds, any other webhook the activity JSON', async () => {
	env.ACTIVITY_WEBHOOK_URLS = 'https://discord.com/api/webhooks/1/token, https://example.com/hook';

	await sendActivityWebhooks([activity]);

	expect(bodies()).toHaveLength(2);
	expect(bodies()).toEqual(
		expect.arrayContaining([
			[
				'https://discord.com/api/webhooks/1/token',
				expect.objectContaining({ embeds: [expect.objectContaining({ title: 'forsen' })] }),
			],
			[
				'https://example.com/hook',
				{
					activities: [
						expect.objectContaining({
							id: 'a1',
							postUpdate: expect.objectContaining({ byteLength: { $bigint: '5' } }),
						}),
					],
				},
			],
		])
	);
});

test('a rate limited message is sent again once, after the time Discord asks for', async () => {
	vi.useFakeTimers();
	env.ACTIVITY_WEBHOOK_URLS = 'https://discord.com/api/webhooks/1/token';
	fetchMock
		.mockResolvedValueOnce(new Response(null, { status: 429, headers: { 'retry-after': '2' } }))
		.mockResolvedValueOnce(new Response(null, { status: 204 }));

	const sending = sendActivityWebhooks([activity]);
	await vi.advanceTimersByTimeAsync(2000);
	await sending;

	expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('a failing webhook is logged without its URL and does not stop the others', async () => {
	env.ACTIVITY_WEBHOOK_URLS =
		'https://discord.com/api/webhooks/1/secret-token https://example.com/hook';
	const log = vi.spyOn(console, 'error').mockImplementation(() => {});
	fetchMock
		.mockResolvedValueOnce(new Response(null, { status: 404 }))
		.mockResolvedValueOnce(new Response(null, { status: 204 }));

	await sendActivityWebhooks([activity]);

	expect(fetchMock).toHaveBeenCalledTimes(2);
	expect(log).toHaveBeenCalledOnce();
	expect(String(log.mock.calls[0][0])).not.toContain('secret-token');
	log.mockRestore();
});
