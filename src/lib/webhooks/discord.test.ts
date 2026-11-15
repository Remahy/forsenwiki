import { expect, test } from 'vitest';

import type { ActivityEntry, ChildActivityEntry } from '$lib/db/activity/read';
import { AVAILABLE_ACTIVITY_TYPES } from '$lib/constants/activity';
import { EMBED_TEMPLATES, isDiscordWebhook, toDiscordMessages } from './discord';

const base: ChildActivityEntry = {
	id: 'activity',
	type: 'ARTICLE_UPDATE',
	explanation: null,
	createdTimestamp: '2026-11-15T20:00:00.000Z',
	user: { id: 'u1', name: 'forsen' },
	post: null,
	postUpdate: null,
	content: null,
	oldName: null,
	newName: null,
	oldTags: [],
	newTags: [],
};

const entry = (
	activity: Partial<ChildActivityEntry>,
	children: Partial<ChildActivityEntry>[] = []
) =>
	({
		...base,
		...activity,
		children: children.map((child) => ({ ...base, ...child })),
	}) as ActivityEntry;

const origin = 'https://forsen.wiki';

test('only Discord webhook URLs get the Discord format', () => {
	expect(isDiscordWebhook('https://discord.com/api/webhooks/1/token')).toBe(true);
	expect(isDiscordWebhook('https://canary.discord.com/api/webhooks/1/token')).toBe(true);
	expect(isDiscordWebhook('https://example.com/discord.com/api/webhooks/1/token')).toBe(false);
});

test('an article update links to the version and the comparison, with linked activities listed', () => {
	const [message] = toDiscordMessages(
		[
			entry(
				{
					post: { title: 'forsen_games', rawTitle: 'forsen games' },
					postUpdate: { id: 'v2', byteLength: 120n, newTitle: 'forsen games', oldTitle: 'games' },
				},
				[
					{
						type: 'ARTICLE_RENAME',
						postUpdate: { id: 'v2', byteLength: 120n, newTitle: 'forsen games', oldTitle: 'games' },
					},
					{ type: 'ARTICLE_RETAG', oldTags: ['satire'], newTags: ['nsfw'] },
				]
			),
		],
		origin
	);

	expect(message.embeds[0]).toMatchObject({
		title: 'forsen games',
		url: 'https://forsen.wiki/w/forsen_games/history/v2',
		author: { name: 'forsen', url: 'https://forsen.wiki/user/u1' },
		footer: { text: 'Article update' },
		timestamp: '2026-11-15T20:00:00.000Z',
	});
	expect(message.embeds[0].description).toBe(
		[
			'[Compare with previous](https://forsen.wiki/w/forsen_games/history/v2-) (120)',
			'**Title change:** "forsen games" was "games"',
			'**Tags added:** NSFW',
			'**Tags removed:** Satire',
		].join('\n')
	);
});

test('deleted content has no link, existing content links to its page', () => {
	const content = {
		id: 'c1',
		hash: 'h',
		name: 'forsen.png',
		type: 'image',
		contentType: 'image/png',
		contentLength: 1234n,
	};
	const [message] = toDiscordMessages(
		[
			entry({ type: 'CONTENT_UPLOAD', content: { ...content, deleted: false } }),
			entry({ type: 'CONTENT_DELETE', content: { ...content, deleted: true } }),
		],
		origin
	);

	expect(message.embeds[0]).toMatchObject({
		url: 'https://forsen.wiki/content/c1',
		description: 'image, image/png\n(1234)',
	});
	expect(message.embeds[1]).not.toHaveProperty('url');
});

test('nothing users wrote can ping or format the channel', () => {
	const [message] = toDiscordMessages(
		[entry({ type: 'CONTENT_RENAME', newName: '@everyone *bold*', oldName: '[x](evil)' })],
		origin
	);

	expect(message.allowed_mentions).toEqual({ parse: [] });
	expect(message.embeds[0]).toMatchObject({
		title: '@everyone \\*bold\\*',
		description: 'Was "\\[x\\]\\(evil\\)"',
	});
});

test('more than ten activities are split over messages, in order', () => {
	const activities = Array.from({ length: 23 }, (_, index) =>
		entry({ id: `a${index}`, type: 'USER_REGISTER' })
	);

	const messages = toDiscordMessages(activities, origin);

	expect(messages.map(({ embeds }) => embeds.length)).toEqual([10, 10, 3]);
});

test('every activity type has a template', () => {
	expect(AVAILABLE_ACTIVITY_TYPES.filter((type) => !EMBED_TEMPLATES[type])).toEqual([]);
});
