import JSONDiffer from 'json-diff';
import { diffChars as CharDiffer } from 'diff';

/**
 * @typedef {import('$lib/components/editor/plugins/Diff/Types').JSONDiffType} JSONDiffType
 * @typedef {{ type: JSONDiffType, text: { __old: any, __new: any, diff: import('diff').Change[] }}} __Change
 */

/**
 * Used to clean up object properties with changed values.
 * @param {Record<string, string | number | { __old: string, __new: string }>} obj
 */
function cleanPropertyDiffChanges(obj) {
	const entries = Object.entries(obj);

	for (let index = 0; index < entries.length; index++) {
		const [key, value] = entries[index];

		if (!obj.___change) {
			continue;
		}

		if (Array.isArray(value)) {
			continue;
		}

		if (typeof value !== 'object') {
			continue;
		}

		if (!(value.__old || value.__new)) {
			continue;
		}

		const { __new } = value;

		obj[key] = __new;

		if (typeof obj.___change !== 'object') {
			throw new Error('___change returned a non valid value.');
		}

		obj.___change = {
			...(obj.___change || {}),
			[key]: value,
		};
	}

	if (typeof obj.___change === 'object') {
		// const { type } = /** @type {{ type: string }} */ (obj);
		const { ___change } =
			/** @type {{ ___change: { [x: string]: { __old: string, __new: string } } }} */ (
				/** @type {unknown} */ (obj)
			);

		// This is a bit complicated.
		if (typeof ___change.text === 'object') {
			const { text } = ___change;

			if (text.__old) {
				const diff = CharDiffer(text.__old, text.__new);
				// @ts-ignore
				text.diff = diff;
			}

			// TODO: Needs more rules.
		}
	}

	return obj;
}

const jsonDiffArrayCharacters = [' ', '~', '+', '-'];

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
			let obj = item['1'];

			if (!jsonDiffArrayCharacters.includes(change)) {
				return item;
			}

			obj.___change = {
				type: change,
			};

			obj = cleanPropertyDiffChanges(obj);

			if (obj.children) {
				obj.children = diffSemanticsFlat(obj.children);
			}

			obj.type = `diff-${obj.type}`;

			return obj;
		});
}

/**
 * @param {import('lexical').SerializedEditor} toUpdate
 * @param {import('lexical').SerializedEditor} fromUpdate
 * @returns
 */
export function getDiffJSON(toUpdate, fromUpdate) {
	const diff = JSONDiffer.diff(toUpdate, fromUpdate, { full: true, raw: true });

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
