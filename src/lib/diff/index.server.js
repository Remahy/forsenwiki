import JSONDiffer from 'json-diff';
import { diffChars as CharDiffer } from 'diff';

/** @param {string} type */
const getReplacedType = (type) => {
	switch (type) {
		case 'heading':
			return 'a-heading';
		case 'link':
			return 'a-link';
		case 'tablecell':
			return 'a-tablecell';
		default:
			return type;
	}
};

/**
 * Used to clean up object properties with changed values.
 * @param {Record<string, string | number | { __old: string, __new: string }>} obj
 */
const cleanPropertyDiffChanges = (obj) => {
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

		if (value == null) {
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

	for (let index = 0; index < entries.length; index++) {
		const [key, value] = entries[index];

		let cleanKey;
		let v;
		if (key.endsWith('__added') && key.length > '__added'.length) {
			cleanKey = /** @type {string} */ (key.split('__').shift());

			v = { __new: value };
		} else if (key.endsWith('__deleted') && key.length > '__deleted'.length) {
			cleanKey = /** @type {string} */ (key.split('__').shift());

			v = { __old: value };
		}

		if (!cleanKey) {
			continue;
		}

		if (typeof obj.___change !== 'object') {
			throw new Error('___change returned a non valid value.');
		}

		obj[cleanKey] = value;

		delete obj[key];

		obj.___change = {
			...(obj.___change || {}),
			[cleanKey]: v,
		};
	}

	if (typeof obj.___change === 'object') {
		const { ___change } =
			/** @type {{ ___change: { [x: string]: { __old: string, __new: string } } }} */ (
				/** @type {unknown} */ (obj)
			);

		// This is a bit complicated.
		if (typeof ___change.text === 'object') {
			const { text } = ___change;

			if (typeof text.__old === 'string' && typeof text.__new === 'string') {
				const diff = CharDiffer(text.__old, text.__new);
				// @ts-ignore
				text.diff = diff;
			}

			// TODO: Needs more rules.
		}
	}

	return obj;
};

const jsonDiffArrayCharacters = [' ', '~', '+', '-'];

/**
 * Used to clean end-result array.
 * @param {any[]} list
 */
const diffSemanticsFlat = (list) => {
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
				___type: change,
			};

			obj = cleanPropertyDiffChanges(obj);

			if (obj.children) {
				obj.children = diffSemanticsFlat(obj.children);
			}

			// Fix "non-replaced" nodes.
			const realType = getReplacedType(obj.type);
			obj.type = `diff-${realType}`;

			return obj;
		});
};

/**
 * @param {import('lexical').SerializedEditor} toUpdate
 * @param {import('lexical').SerializedEditor} fromUpdate
 */
export const getDiffJSON = (toUpdate, fromUpdate) => {
	const diff = JSONDiffer.diff(structuredClone(toUpdate), structuredClone(fromUpdate), { full: true, raw: true });

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
};
