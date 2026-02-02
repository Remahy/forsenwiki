import { error, json } from '@sveltejs/kit';
import { createHeadlessEditor } from '@lexical/headless';

import { mergePostUpdatesV2, postUpdatesToUint8Arr } from '$lib/yjs/utils';
import { readYPostUpdatesWithIdByTitle } from '$lib/db/article/read';
import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor';
import { readAuthorForYPostUpdate } from '$lib/db/metadata/read';
import { getDiffJSON } from '$lib/diff/index.server';
import { articleConfig } from '$lib/components/editor/config/article';
import { diffConfig } from '$lib/components/editor/config/diff';
import toHTML from '$lib/worker/toHTML';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';
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

	const { editor: tEditor } = getYjsAndEditor(
		articleConfig(null, EDITOR_IS_READONLY, null),
		updatesTo
	);
	const toUpdate = tEditor.toJSON();

	const { editor: fEditor } = getYjsAndEditor(
		articleConfig(null, EDITOR_IS_READONLY, null),
		updatesFrom
	);
	const fromUpdate = fEditor.toJSON();

	const [toAuthor, fromAuthor] = await Promise.all([
		readAuthorForYPostUpdate(toPostUpdateId),
		readAuthorForYPostUpdate(fromPostUpdateId),
	]);

	const diffJSON = getDiffJSON(toUpdate, fromUpdate);

	const editor = createHeadlessEditor(diffConfig(null, EDITOR_IS_READONLY, null));

	editor.setEditorState(editor.parseEditorState(diffJSON.editorState));

	const editorJSON = editor.toJSON();

	const diffHTML = await toHTML({ config: 'diff', content: JSON.stringify(diffJSON.editorState) });

	return {
		toPostUpdateId,
		toDate,
		toAuthor,
		fromPostUpdateId,
		fromDate,
		fromAuthor,
		diffJSON,
		editorJSON,
		diffHTML,
		post: {
			title: res.title,
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
