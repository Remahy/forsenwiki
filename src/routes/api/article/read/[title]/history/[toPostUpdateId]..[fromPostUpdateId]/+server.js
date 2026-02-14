import { error, json } from '@sveltejs/kit';

import { mergePostUpdatesV2, postUpdatesToUint8Arr } from '$lib/yjs/utils';
import { readYPostUpdatesWithIdByTitle } from '$lib/db/article/read';
import { readAuthorForYPostUpdate } from '$lib/db/metadata/read';
import toHTML from '$lib/worker/toHTML';
import getDiffJSON from '$lib/worker/getDiffJSON';
import { replacer } from '$lib/utils/json';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';

/**
 * @param {string} title
 * @param {string} toPostUpdateId
 * @param {string?} _fromPostUpdateId
 */
export async function _getYPostUpdateIds(title, toPostUpdateId, _fromPostUpdateId) {
	const res = await readYPostUpdatesWithIdByTitle(title);

	if (!res) {
		throw 404;
	}

	const toPostUpdateIdIndex = res.postUpdates.findIndex(({ id }) => id === toPostUpdateId);

	if (toPostUpdateIdIndex === -1) {
		throw 404;
	}

	let fromPostUpdateId = _fromPostUpdateId;
	if (!_fromPostUpdateId) {
		const index = toPostUpdateIdIndex - 1;

		fromPostUpdateId = index > -1 ? res.postUpdates[index].id : null;
	}

	if (!fromPostUpdateId) {
		return { res, toPostUpdateId, toPostUpdateIdIndex };
	}

	if (toPostUpdateId === fromPostUpdateId) {
		throw 400;
	}

	const fromPostUpdateIdIndex = res.postUpdates.findIndex(({ id }) => id === fromPostUpdateId);

	return { res, toPostUpdateId, toPostUpdateIdIndex, fromPostUpdateId, fromPostUpdateIdIndex };
}

/**
 * @param {string} title
 * @param {string} _toPostUpdateId
 * @param {string} _fromPostUpdateId
 */
export async function _getToYPostUpdateFromYPostUpdateByTitle(
	title,
	_toPostUpdateId,
	_fromPostUpdateId
) {
	const { res, toPostUpdateId, toPostUpdateIdIndex, fromPostUpdateId, fromPostUpdateIdIndex } =
		await _getYPostUpdateIds(title, _toPostUpdateId, _fromPostUpdateId);

	if (!fromPostUpdateId || fromPostUpdateIdIndex === -1 || !fromPostUpdateIdIndex) {
		throw 404;
	}

	const { createdTimestamp: toDate } = res.postUpdates[toPostUpdateIdIndex];
	const { createdTimestamp: fromDate } = res.postUpdates[fromPostUpdateIdIndex];

	const toPostUpdates = postUpdatesToUint8Arr(res.postUpdates.slice(0, toPostUpdateIdIndex + 1));
	const fromPostUpdates = postUpdatesToUint8Arr(
		res.postUpdates.slice(0, fromPostUpdateIdIndex + 1)
	);

	const updatesTo = mergePostUpdatesV2(toPostUpdates);
	const updatesFrom = mergePostUpdatesV2(fromPostUpdates);

	const diffJSON = await getDiffJSON({ updatesTo, updatesFrom });

	const diffHTML = await toHTML({ config: 'diff', content: diffJSON });

	const [toAuthor, fromAuthor] = await Promise.all([
		readAuthorForYPostUpdate(toPostUpdateId),
		readAuthorForYPostUpdate(fromPostUpdateId),
	]);

	return {
		toPostUpdateId,
		toDate,
		toAuthor,
		fromPostUpdateId,
		fromDate,
		fromAuthor,
		diffHTML,
		post: {
			title: res.title,
			rawTitle: res.rawTitle,
			outRelations: res.outRelations,
		},
	};
}

export async function GET({ params }) {
	const { title: rawTitle, fromPostUpdateId, toPostUpdateId } = params;
	const { sanitized: title } = sanitizeTitle(rawTitle);

	try {
		const res = await _getToYPostUpdateFromYPostUpdateByTitle(
			title,
			toPostUpdateId,
			fromPostUpdateId
		);

		const safeJSON = JSON.parse(JSON.stringify(res, replacer));

		return json(safeJSON);
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}
}
