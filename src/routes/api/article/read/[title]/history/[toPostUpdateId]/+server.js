import { error, json } from '@sveltejs/kit';
import { readYPostUpdatesWithIdByTitle } from '$lib/db/article/read';
import { yPostUpdatesToBase64 } from '$lib/yjs/utils';
import { readAuthorForYPostUpdate } from '$lib/db/metadata/read';
import { replacer } from '$lib/utils/json';
import { updateToHTML } from '$lib/lexical/updateToHTML';

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

	const {
		id,
		createdTimestamp,
		metadata: { byteLength },
	} = res.postUpdates[toPostUpdateIdIndex];

	const toPostUpdates = res.postUpdates.slice(0, toPostUpdateIdIndex + 1);
	const base64String = yPostUpdatesToBase64(toPostUpdates);

	const recentPostUpdateId = res.postUpdates[res.postUpdates.length - 1].id;

	const [author, html] = await Promise.all([
		readAuthorForYPostUpdate(id),
		updateToHTML(base64String),
	]);

	return {
		createdTimestamp,
		author,
		html,
		current,
		byteLength,
		toPostUpdateId: id,
		recentPostUpdateId,
	};
}

export async function GET({ params }) {
	const { title, toPostUpdateId } = params;

	try {
		const res = await _getToYPostUpdateIdByTitle(title, toPostUpdateId);

		const safeJSON = JSON.stringify(res, replacer);

		return json(safeJSON);
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}
}
