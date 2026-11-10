import { error, json } from '@sveltejs/kit';
import { uint8ArrayToBase64 } from 'uint8array-extras';

import { yPostUpdatesV2ToBase64 } from '$lib/y/utils';

import { createDiffUpdates } from '$lib/y/diff';
import toHTML from '$lib/worker/toHTML';
import { readYPostUpdatesWithIdByTitle } from '$lib/db/post/read';
import { readAuthorForYPostUpdate, readUserNamesByIds } from '$lib/db/metadata/read';
import { replacer } from '$lib/utils/json';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';
import { canDiff, currentRows, LEXICAL_Y, NOT_COMPARABLE_MESSAGE } from '$lib/y/rows';

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

	const toPostUpdate = res.postUpdates[toPostUpdateIdIndex];

	let fromPostUpdateId = _fromPostUpdateId;
	if (!_fromPostUpdateId) {
		const previous = res.postUpdates[toPostUpdateIdIndex - 1];

		fromPostUpdateId = canDiff(toPostUpdate, previous) ? previous.id : null;
	}

	if (!fromPostUpdateId) {
		return { res, toPostUpdateId, toPostUpdateIdIndex };
	}

	if (toPostUpdateId === fromPostUpdateId) {
		throw 400;
	}

	const fromPostUpdateIdIndex = res.postUpdates.findIndex(({ id }) => id === fromPostUpdateId);

	if (
		fromPostUpdateIdIndex !== -1 &&
		!canDiff(toPostUpdate, res.postUpdates[fromPostUpdateIdIndex])
	) {
		error(400, NOT_COMPARABLE_MESSAGE);
	}

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

	if (!fromPostUpdateId || fromPostUpdateIdIndex === undefined || fromPostUpdateIdIndex === -1) {
		throw 404;
	}

	const { createdTimestamp: toDate } = res.postUpdates[toPostUpdateIdIndex];
	const { createdTimestamp: fromDate } = res.postUpdates[fromPostUpdateIdIndex];

	const rows = currentRows(res.postUpdates);
	const indexes = [fromPostUpdateId, toPostUpdateId].map((postUpdateId) =>
		rows.findIndex(({ id }) => id === postUpdateId)
	);
	const olderIndex = Math.min(...indexes);
	const newerIndex = Math.max(...indexes);

	const diff = createDiffUpdates(rows, olderIndex, newerIndex);

	const authorIds = rows
		.slice(olderIndex + 1, newerIndex + 1)
		.map(({ metadata }) => metadata.userId);

	const [toAuthor, fromAuthor, authors, newer, older, article] = await Promise.all([
		readAuthorForYPostUpdate(toPostUpdateId),
		readAuthorForYPostUpdate(fromPostUpdateId),
		readUserNamesByIds(authorIds),
		toHTML({ config: 'diff', update: uint8ArrayToBase64(diff.newer) }),
		toHTML({ config: 'diff', update: uint8ArrayToBase64(diff.older) }),
		toHTML({
			config: 'article',
			update: yPostUpdatesV2ToBase64(rows.slice(0, newerIndex + 1)),
			format: LEXICAL_Y,
		}),
	]);

	const newerBlocks = newer.blocks ?? [];
	// A reverted block type can regroup blocks, the sides then no longer pair up by index.
	const olderBlocks = older.blocks?.length === newerBlocks.length ? older.blocks : newerBlocks;

	const changes = newerBlocks
		.map((block, index) => ({ older: olderBlocks[index], newer: block }))
		.filter(
			(change) => change.newer.includes(' data-diff="') || change.older.includes(' data-diff="')
		);

	return {
		toPostUpdateId,
		toDate,
		toAuthor,
		fromPostUpdateId,
		fromDate,
		fromAuthor,
		/** Who made the changes shown, by the user id in the HTML's `data-diff-by`. */
		authors,
		/** The blocks that changed, as they were and as they are. */
		changes,
		/** The newer of the two versions, in full. */
		html: article,
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
