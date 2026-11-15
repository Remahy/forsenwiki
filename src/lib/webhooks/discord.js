import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS } from '$lib/constants/activity';
import { DISCLAIMER_TAG_LABELS } from '$lib/constants/constants';

/**
 * @typedef {import('$lib/db/activity/read').ActivityEntry} ActivityEntry
 * @typedef {import('$lib/db/activity/read').ChildActivityEntry} ChildActivityEntry
 */

// https://discord.com/developers/docs/resources/message#embed-object-embed-limits
const MAX_EMBEDS = 10;
const MAX_TITLE = 256;
const MAX_DESCRIPTION = 4096;

/** @type {Record<import('$lib/constants/activity').ActivityType, number>} */
const COLORS = {
	ARTICLE_CREATE: 0x10b981,
	ARTICLE_UPDATE: 0xf97316,
	ARTICLE_RENAME: 0xf97316,
	ARTICLE_RETAG: 0xf97316,
	USER_REGISTER: 0x64748b,
	USER_RENAME: 0x64748b,
	CONTENT_UPLOAD: 0x8b5cf6,
	CONTENT_DELETE: 0xef4444,
	CONTENT_RENAME: 0xd946ef,
};

export const isDiscordWebhook = (/** @type {string} */ url) =>
	/^https:\/\/(?:[a-z]+\.)?discord(?:app)?\.com\/api\/webhooks\//.test(url);

/** @param {string} text */
const escape = (text) => text.replace(/[\\*_~`|>#[\]()-]/g, '\\$&');

/**
 * @param {string} text
 * @param {number} max
 */
const truncate = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** @param {string} tag */
const tagLabel = (tag) => DISCLAIMER_TAG_LABELS[tag] ?? tag;

/**
 * @param {ChildActivityEntry} activity
 * @param {string} origin
 * @returns {{ title: string, url?: string }}
 */
const subject = ({ type, post, postUpdate, user, content }, origin) => {
	if (post) {
		const article = `${origin}/w/${encodeURIComponent(post.title)}`;

		return {
			title: post.rawTitle,
			url: postUpdate ? `${article}/history/${postUpdate.id}` : article,
		};
	}

	if (content) {
		return {
			title: content.name,
			url: content.deleted ? undefined : `${origin}/content/${content.id}`,
		};
	}

	if (user && type === ACTIVITY_TYPES.USER_REGISTER) {
		return { title: user.name ?? 'Unknown', url: `${origin}/user/${user.id}` };
	}

	return { title: ACTIVITY_TYPE_LABELS[type] ?? type };
};

/**
 * @param {ChildActivityEntry} activity
 * @param {string} origin
 */
const details = (
	{ type, post, postUpdate, content, oldName, newName, oldTags, newTags },
	origin
) => {
	switch (type) {
		case ACTIVITY_TYPES.ARTICLE_UPDATE:
			return post && postUpdate
				? `[Compare with previous](${origin}/w/${encodeURIComponent(post.title)}/history/${postUpdate.id}-) (${postUpdate.byteLength})`
				: '';
		case ACTIVITY_TYPES.ARTICLE_CREATE:
			return postUpdate ? `(${postUpdate.byteLength})` : '';
		case ACTIVITY_TYPES.ARTICLE_RENAME:
			return `"${escape(postUpdate?.newTitle ?? '')}" was "${escape(postUpdate?.oldTitle ?? '')}"`;
		case ACTIVITY_TYPES.ARTICLE_RETAG: {
			const added = newTags.filter((tag) => !oldTags.includes(tag)).map(tagLabel);
			const removed = oldTags.filter((tag) => !newTags.includes(tag)).map(tagLabel);

			return [
				added.length ? `Added: ${added.join(', ')}` : '',
				removed.length ? `Removed: ${removed.join(', ')}` : '',
			]
				.filter(Boolean)
				.join(' ');
		}
		case ACTIVITY_TYPES.CONTENT_UPLOAD:
		case ACTIVITY_TYPES.CONTENT_DELETE:
			return content
				? `${content.contentLength !== null ? `(${content.contentLength}) ` : ''}${content.type ?? 'unknown'}${content.contentType ? `, ${content.contentType}` : ''}`
				: '';
		case ACTIVITY_TYPES.CONTENT_RENAME:
			return `"${escape(newName ?? '')}" was "${escape(oldName ?? '')}"`;
		default:
			return '';
	}
};

/**
 * @param {ActivityEntry} activity
 * @param {string} origin
 */
const toEmbed = (activity, origin) => {
	const { type, user, explanation, children, createdTimestamp } = activity;
	const { title, url } = subject(activity, origin);

	const childLines = children.map((child) => {
		const detail =
			details(child, origin) || (child.explanation ? `*${escape(child.explanation)}*` : '');

		return `**${ACTIVITY_TYPE_LABELS[child.type] ?? child.type}:** ${detail}`;
	});

	const description = [
		details(activity, origin),
		explanation ? `*${escape(explanation)}*` : '',
		...childLines,
	]
		.filter(Boolean)
		.join('\n');

	return {
		title: truncate(title, MAX_TITLE),
		...(url ? { url } : {}),
		...(description ? { description: truncate(description, MAX_DESCRIPTION) } : {}),
		color: COLORS[type],
		...(user?.name && type !== ACTIVITY_TYPES.USER_REGISTER
			? { author: { name: user.name, url: `${origin}/user/${user.id}` } }
			: {}),
		footer: { text: ACTIVITY_TYPE_LABELS[type] ?? type },
		timestamp: createdTimestamp,
	};
};

/**
 * @param {ActivityEntry[]} activities
 * @param {string} origin
 */
export const toDiscordMessages = (activities, origin) => {
	const embeds = activities.map((activity) => toEmbed(activity, origin));

	return Array.from({ length: Math.ceil(embeds.length / MAX_EMBEDS) }, (_, index) => ({
		embeds: embeds.slice(index * MAX_EMBEDS, (index + 1) * MAX_EMBEDS),
		// Titles and names are user written, "@everyone" in one must not ping.
		allowed_mentions: { parse: [] },
	}));
};
