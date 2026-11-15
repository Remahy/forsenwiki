import { ACTIVITY_TYPE_LABELS } from '$lib/constants/activity';
import { DISCLAIMER_TAG_LABELS } from '$lib/constants/constants';
import { render } from './template';
import message from './templates/discord/message.json';
import children from './templates/discord/children.json';

/**
 * @typedef {import('$lib/db/activity/read').ActivityEntry} ActivityEntry
 * @typedef {import('$lib/db/activity/read').ChildActivityEntry} ChildActivityEntry
 * @typedef {{ title?: string, description?: string, [key: string]: unknown }} DiscordEmbed
 * @typedef {{ embeds: DiscordEmbed[], allowed_mentions?: { parse: string[] }, [key: string]: unknown }} DiscordMessage
 */

// https://discord.com/developers/docs/resources/message#embed-object-embed-limits
const MAX_EMBEDS = 10;
const MAX_TITLE = 256;
const MAX_DESCRIPTION = 4096;

/** @type {Record<string, unknown>} */
export const EMBED_TEMPLATES = Object.fromEntries(
	Object.entries(
		import.meta.glob('./templates/discord/*.json', { eager: true, import: 'default' })
	).map(([path, template]) => [path.split('/').pop()?.replace('.json', ''), template])
);

/** @type {Record<string, string>} */
const CHILD_TEMPLATES = children;

export const isDiscordWebhook = (/** @type {string} */ url) =>
	/^https:\/\/(?:[a-z]+\.)?discord(?:app)?\.com\/api\/webhooks\//.test(url);

/** @param {string} text */
const escape = (text) => text.replace(/[\\*_~`|>#[\]()-]/g, '\\$&');

/**
 * @param {string} text
 * @param {number} max
 */
const truncate = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** @param {string[]} tags */
const tagLabels = (tags) => tags.map((tag) => DISCLAIMER_TAG_LABELS[tag] ?? tag).join(', ');

/**
 * @param {ChildActivityEntry} activity
 * @param {string} origin
 */
const toView = (activity, origin) => {
	const { type, user, post, postUpdate, content, oldTags, newTags } = activity;
	const article = post && `${origin}/w/${encodeURIComponent(post.title)}`;

	return {
		label: ACTIVITY_TYPE_LABELS[type] ?? type,
		timestamp: activity.createdTimestamp,
		explanation: activity.explanation,
		oldName: activity.oldName,
		newName: activity.newName,
		addedTags: tagLabels(newTags.filter((tag) => !oldTags.includes(tag))),
		removedTags: tagLabels(oldTags.filter((tag) => !newTags.includes(tag))),
		user: user?.name ? { name: user.name, url: `${origin}/user/${user.id}` } : null,
		post: post && { title: post.rawTitle, url: article },
		postUpdate: postUpdate && {
			url: `${article}/history/${postUpdate.id}`,
			compareUrl: `${article}/history/${postUpdate.id}-`,
			byteLength: postUpdate.byteLength?.toString(),
			newTitle: postUpdate.newTitle,
			oldTitle: postUpdate.oldTitle,
		},
		content: content && {
			name: content.name,
			url: content.deleted ? null : `${origin}/content/${content.id}`,
			type: content.type,
			contentType: content.contentType,
			contentLength: content.contentLength?.toString(),
		},
	};
};

/**
 * @param {ActivityEntry} activity
 * @param {string} origin
 */
const toEmbed = (activity, origin) => {
	const childLines = activity.children
		.map((child) =>
			render(CHILD_TEMPLATES[child.type] ?? CHILD_TEMPLATES.default, toView(child, origin), {
				escape,
			})
		)
		.filter(Boolean);

	const embed = /** @type {DiscordEmbed} */ (
		render(
			EMBED_TEMPLATES[activity.type],
			{ ...toView(activity, origin), children: childLines.join('\n') },
			{ escape }
		) ?? {}
	);

	return {
		...embed,
		...(embed.title ? { title: truncate(embed.title, MAX_TITLE) } : {}),
		...(embed.description ? { description: truncate(embed.description, MAX_DESCRIPTION) } : {}),
	};
};

/**
 * One message per ten activities, in the given order.
 * @param {ActivityEntry[]} activities
 * @param {string} origin
 * @returns {DiscordMessage[]}
 */
export const toDiscordMessages = (activities, origin) => {
	const embeds = activities.map((activity) => toEmbed(activity, origin));

	return Array.from(
		{ length: Math.ceil(embeds.length / MAX_EMBEDS) },
		(_, index) =>
			/** @type {DiscordMessage} */ (
				render(message, { embeds: embeds.slice(index * MAX_EMBEDS, (index + 1) * MAX_EMBEDS) })
			)
	);
};
