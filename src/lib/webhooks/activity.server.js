// Read at runtime: a webhook URL is a secret that can be rotated without a rebuild.
import { env } from '$env/dynamic/private';
import { DOMAIN } from '$lib/environment/environment';
import { replacer } from '$lib/utils/json';
import { isDiscordWebhook, toDiscordMessages } from './discord';

const TIMEOUT = 10_000;
const MAX_RETRY_AFTER = 30;

const webhookUrls = () => (env.ACTIVITY_WEBHOOK_URLS ?? '').split(/[\s,]+/).filter(Boolean);

/**
 * @param {string} url
 * @param {string} body
 * @param {boolean} [retried]
 * @returns {Promise<void>}
 */
const post = async (url, body, retried = false) => {
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body,
		signal: AbortSignal.timeout(TIMEOUT),
	});

	if (response.status === 429 && !retried) {
		const seconds = Math.min(Number(response.headers.get('retry-after')) || 1, MAX_RETRY_AFTER);
		await new Promise((resolve) => setTimeout(resolve, seconds * 1000));

		return post(url, body, true);
	}

	if (!response.ok) {
		throw new Error(`Activity webhook responded with ${response.status}.`);
	}
};

/**
 * @param {string} url
 * @param {import('$lib/db/activity/read').ActivityEntry[]} activities
 */
const deliver = (url, activities) => {
	if (!isDiscordWebhook(url)) {
		return post(url, JSON.stringify({ activities }, replacer));
	}

	// The reduce shows them in order.
	return toDiscordMessages(activities, DOMAIN).reduce(
		(previous, message) => previous.then(() => post(url, JSON.stringify(message))),
		Promise.resolve()
	);
};

/**
 * Only ever pass activities read as a non-moderator.
 * @param {import('$lib/db/activity/read').ActivityEntry[]} activities
 */
export const sendActivityWebhooks = async (activities) => {
	const urls = webhookUrls();

	if (!urls.length || !activities.length) {
		return;
	}

	const results = await Promise.allSettled(urls.map((url) => deliver(url, activities)));

	results.forEach((result) => {
		if (result.status === 'rejected') {
			console.error(result.reason);
		}
	});
};
