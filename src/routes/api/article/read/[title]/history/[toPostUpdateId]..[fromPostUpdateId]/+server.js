import { error, json } from '@sveltejs/kit';
import JSONDiffer from 'json-diff';
import { diffChars as CharDiffer } from 'diff';
import { createHeadlessEditor } from '@lexical/headless';

import { mergePostUpdates, postUpdatesToUint8Arr } from '$lib/yjs/utils';
import { readYPostUpdatesWithIdByTitle } from '$lib/db/article/read';
import { articleConfig } from '$lib/components/editor/config/article';
import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor';
import { readAuthorForYPostUpdate } from '$lib/db/metadata/read';
import { diffConfig } from '$lib/components/editor/config/diff';
import { toHTML } from '$lib/lexicalHTML';

const jsonDiffArrayCharacters = ['+', '-', '~', ' '];

/**
 * @typedef {{ [x: string]: any, text: string | { __old: string, __new: string, diff: import('diff').Change[] }, ___change: ' ' | '~' | '+' | '-' }} Node
 */
// /**
//  * @param {Node[]} children
//  */
// function childrenModification(children) {
// 	return children.toReversed().reduce((/** @type {Node[]} */ previousValue, currentValue) => {
// 		const { /* ___change, */ text } = currentValue;
// 		// if (typeof ___change === 'string') {}
// 		if (typeof text === 'object' && text.__new && text.__old) {
// 			/** @type {Node[]} */
// 			const newNodes = [];
// 			newNodes.push({ ...currentValue, text: text.__new, added: true });
// 			newNodes.push({ ...currentValue, text: text.__old, removed: true });
// 			return [...previousValue, ...newNodes];
// 		}
// 		return [...previousValue, currentValue];
// 	}, []).toReversed();
// }

/**
 * @param {Node[]} children
 */
function childrenDiffText(children) {
	return children.toReversed().reduce((/** @type {Node[]} */ previousValue, currentValue) => {
		const { text, type } = currentValue;
		// if (typeof ___change === 'string') {}
		if (type === 'text' && typeof text === 'object' && text.__new && text.__old) {
			const newNode = { ...currentValue };

			const diff = CharDiffer(text.__old, text.__new);

			newNode.text = { ...text, diff };
			newNode.type = 'diff-text';

			return [...previousValue, newNode];
		}

		return [...previousValue, currentValue];
	}, []).toReversed();
}

/**
 * Used to clean end-result array.
 * @param {any[]} list
 */
function diffSemanticsFlat(list) {
	return list
		.map((item) => {
			return { ...item };
		})
		.map((item) => {
			const change = item['0'];
			const obj = item['1'];

			if (!jsonDiffArrayCharacters.includes(change)) {
				return item;
			}

			obj.___change = change;

			if (obj.type === 'paragraph') {
				obj.type = 'diff-paragraph';
			}

			if (obj.children) {
				obj.children = diffSemanticsFlat(obj.children);

				// Modify children.
				// obj.children = childrenModification(obj.children);

				// Modify children text.
				obj.children = childrenDiffText(obj.children);
			}

			return obj;
		});
}

/**
 * @param {import('lexical').SerializedEditor} diff
 */
function getDiffJSON(diff) {
	return {
		...diff,
		editorState: {
			...diff.editorState,
			root: {
				...diff.editorState.root,
				children: diffSemanticsFlat(diff.editorState.root.children),
			},
		},
	};
}

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
	const fromPostUpdates = postUpdatesToUint8Arr(res.postUpdates.slice(0, fromPostUpdateIdIndex + 1));

	const updatesTo = mergePostUpdates(toPostUpdates);
	const updatesFrom = mergePostUpdates(fromPostUpdates);

	const { editor: tEditor } = getYjsAndEditor(articleConfig(null, false, null), updatesTo);
	const toUpdate = tEditor.toJSON();

	const { editor: fEditor } = getYjsAndEditor(articleConfig(null, false, null), updatesFrom);
	const fromUpdate = fEditor.toJSON();

	const [toAuthor, fromAuthor] = await Promise.all([
		readAuthorForYPostUpdate(toPostUpdateId),
		readAuthorForYPostUpdate(fromPostUpdateId),
	]);

	const diff = JSONDiffer.diff(toUpdate, fromUpdate, { full: true, raw: true });

	const cleanedDiffJSON =  getDiffJSON(diff);

	const editor = createHeadlessEditor(diffConfig(null, false, null));

	editor.setEditorState(editor.parseEditorState(cleanedDiffJSON.editorState));

	const diffHTML = await toHTML(editor);

	return {
		toPostUpdateId,
		toDate,
		toAuthor,
		fromPostUpdateId,
		fromDate,
		fromAuthor,
		diffJSON: cleanedDiffJSON,
		editorJSON: editor.toJSON(),
		diffHTML,
		// cleanUpdate,
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
