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

/**
 * @param {string} title
 * @param {string} toPostUpdateId
 * @param {string} fromPostUpdateId
 */
export async function _getToYPostUpdateFromYPostUpdateByTitle(
	title,
	toPostUpdateId,
	fromPostUpdateId
) {
	const res = await readYPostUpdatesWithIdByTitle(title);

	if (!res) {
		throw 404;
	}

	const toPostUpdateIdIndex = res.postUpdates.findIndex(({ id }) => id === toPostUpdateId);

	if (toPostUpdateIdIndex === -1) {
		throw 404;
	}

	const fromPostUpdateIdIndex = res.postUpdates.findIndex(({ id }) => id === fromPostUpdateId);

	if (fromPostUpdateIdIndex === -1) {
		throw 404;
	}

	if (toPostUpdateIdIndex === fromPostUpdateIdIndex) {
		throw 400;
	}

	const { createdTimestamp: toDate } = res.postUpdates[toPostUpdateIdIndex];
	const { createdTimestamp: fromDate } = res.postUpdates[fromPostUpdateIdIndex];

	const toPostUpdates = postUpdatesToUint8Arr(res.postUpdates.slice(0, toPostUpdateIdIndex + 1));
	const fromPostUpdates = postUpdatesToUint8Arr(
		res.postUpdates.slice(0, fromPostUpdateIdIndex + 1)
	);

	const updatesTo = mergePostUpdatesV2(toPostUpdates);
	const updatesFrom = mergePostUpdatesV2(fromPostUpdates);

	const { editor: tEditor } = getYjsAndEditor(articleConfig(null, EDITOR_IS_READONLY, null), updatesTo);
	const toUpdate = tEditor.toJSON();

	const { editor: fEditor } = getYjsAndEditor(articleConfig(null, EDITOR_IS_READONLY, null), updatesFrom);
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
	};
}

export async function GET({ params }) {
	const { fromPostUpdateId, toPostUpdateId, title } = params;

	try {
		const res = await _getToYPostUpdateFromYPostUpdateByTitle(
			title,
			toPostUpdateId,
			fromPostUpdateId
		);

		return json(res);
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}
}
