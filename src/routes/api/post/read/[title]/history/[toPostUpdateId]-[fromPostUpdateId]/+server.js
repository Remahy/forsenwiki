import { error, json } from '@sveltejs/kit';

import { diffPage, diffVersions } from '$lib/diff/index.server';
import { readHTMLForYPost, readYPostUpdatesWithIdByTitle } from '$lib/db/post/read';
import { readAuthorForYPostUpdate, readUserNamesByIds } from '$lib/db/metadata/read';
import { replacer } from '$lib/utils/json';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';
import { canDiff, currentRows, NOT_COMPARABLE_MESSAGE } from '$lib/y/rows';

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
const comparedVersions = async (title, _toPostUpdateId, _fromPostUpdateId) => {
	const { res, toPostUpdateId, toPostUpdateIdIndex, fromPostUpdateId, fromPostUpdateIdIndex } =
		await _getYPostUpdateIds(title, _toPostUpdateId, _fromPostUpdateId);

	if (!fromPostUpdateId || fromPostUpdateIdIndex === undefined || fromPostUpdateIdIndex === -1) {
		throw 404;
	}

	const rows = currentRows(res.postUpdates);
	const indexes = [fromPostUpdateId, toPostUpdateId].map((postUpdateId) =>
		rows.findIndex(({ id }) => id === postUpdateId)
	);

	return {
		res,
		toPostUpdateId,
		toPostUpdateIdIndex,
		fromPostUpdateId,
		fromPostUpdateIdIndex,
		rows,
		olderIndex: Math.min(...indexes),
		newerIndex: Math.max(...indexes),
	};
};

/**
 * @param {string} title
 * @param {string} toPostUpdateId
 * @param {string} fromPostUpdateId
 * @param {number} page
 */
export async function _getDiffPage(title, toPostUpdateId, fromPostUpdateId, page) {
	const { rows, olderIndex, newerIndex } = await comparedVersions(
		title,
		toPostUpdateId,
		fromPostUpdateId
	);

	const { changes, pages } = await diffPage(rows, olderIndex, newerIndex, page);

	return { changes, page, pages };
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
	const {
		res,
		toPostUpdateId,
		toPostUpdateIdIndex,
		fromPostUpdateId,
		fromPostUpdateIdIndex,
		rows,
		olderIndex,
		newerIndex,
	} = await comparedVersions(title, _toPostUpdateId, _fromPostUpdateId);

	const { createdTimestamp: toDate } = res.postUpdates[toPostUpdateIdIndex];
	const { createdTimestamp: fromDate } = res.postUpdates[fromPostUpdateIdIndex];

	const authorIds = rows
		.slice(olderIndex + 1, newerIndex + 1)
		.map(({ metadata }) => metadata.userId);

	const isLive = rows[newerIndex].id === res.postUpdates.at(-1)?.id;
	const stored = isLive ? await readHTMLForYPost(res.id) : null;
	const article = stored && {
		html: stored.content,
		text: stored.text ?? '',
		image: stored.image ?? undefined,
	};

	const [toAuthor, fromAuthor, authors, diff] = await Promise.all([
		readAuthorForYPostUpdate(toPostUpdateId),
		readAuthorForYPostUpdate(fromPostUpdateId),
		readUserNamesByIds(authorIds),
		diffVersions(rows, olderIndex, newerIndex, { article }),
	]);

	return {
		toPostUpdateId,
		toDate,
		toAuthor,
		fromPostUpdateId,
		fromDate,
		fromAuthor,
		authors,
		changes: diff.changes,
		pages: diff.pages,
		total: diff.total,
		partial: diff.partial,
		view: diff.view,
		attributed: diff.attributed,
		html: diff.article,
		post: {
			title: res.title,
			rawTitle: res.rawTitle,
			outRelations: res.outRelations,
		},
	};
}

export async function GET({ params, url }) {
	const { title: rawTitle, fromPostUpdateId, toPostUpdateId } = params;
	const { sanitized: title } = sanitizeTitle(rawTitle);
	const page = Number(url.searchParams.get('page') ?? 0);

	if (!Number.isInteger(page) || page < 0) {
		return error(400);
	}

	try {
		const res = page
			? await _getDiffPage(title, toPostUpdateId, fromPostUpdateId, page)
			: await _getToYPostUpdateFromYPostUpdateByTitle(title, toPostUpdateId, fromPostUpdateId);

		const safeJSON = JSON.parse(JSON.stringify(res, replacer));

		return json(safeJSON);
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}
}
