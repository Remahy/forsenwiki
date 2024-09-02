import { error, json } from '@sveltejs/kit';
import { readYPostUpdatesWithIdByTitle } from '$lib/db/article/read';
import { _updateToHTML } from '../../+server.js';
import { yPostUpdatesToBase64 } from '$lib/yjs/utils.js';
import { readAuthorForYPostUpdate } from '$lib/db/metadata/read.js';

/**
 * @param {string} title
 * @param {string} toPostUpdateId
 */
export async function _getToYPostUpdateIdByTitle(title, toPostUpdateId) {
	const res = await readYPostUpdatesWithIdByTitle(title);

	if (!res) {
		throw 404;
	}

	const toPostUpdateIdIndex = res.postUpdates.findIndex(({ id }) => id === toPostUpdateId);

	if (toPostUpdateIdIndex === -1) {
		throw 404;
	}

	let current = false;
	if (toPostUpdateIdIndex === res.postUpdates.length - 1) {
		current = true;
	}

	const { id, createdTimestamp } = res.postUpdates[toPostUpdateIdIndex];

	const author = await readAuthorForYPostUpdate(id);

	const toPostUpdates = res.postUpdates.slice(0, toPostUpdateIdIndex);
	const base64String = yPostUpdatesToBase64(toPostUpdates);
	const html = await _updateToHTML(base64String);

	return {
		createdTimestamp,
		author,
		html,
		current,
	};
}

export async function GET({ params }) {
	try {
		const res = await _getToYPostUpdateIdByTitle(params.title, params.toPostUpdateId);

		return json(res);
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}
}
