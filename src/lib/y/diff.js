import * as Y from '@y/y';
import { createYDoc, DEFAULT_ROOT_NAME } from '@lexical/y';

import { attributeRows } from './attribution';
import { DIFF_STATE_KEY } from './diffState';
import { convertUpdateFormatV2ToV1, mergePostUpdatesV2, postUpdatesToUint8Arr } from './utils';

/**
 * @typedef {import('./diffState').DiffMark} DiffMark
 * @typedef {import('./diffState').DiffFields} DiffFields
 * @typedef {InstanceType<typeof Y.Item>} YItem
 * @typedef {Record<string, unknown>} Reverts
 * @typedef {InstanceType<typeof Y.Node<any>>} YNode
 * @typedef {Array<InstanceType<typeof Y.ContentAttribute<any>>> | null | undefined} Attrs
 */

const MARK = `s:${DIFF_STATE_KEY}`;
const LINE_MARKER = '¶';
const IGNORED_FIELDS = new Set([MARK, 's:blockId', 's:$', 'g:$', 'c', 'o']);
const FORMAT_FIELDS = /^[fpw]:/;

/**
 * @param {YItem} item
 * @returns {YNode | null}
 */
const typeOf = (item) =>
	item.content instanceof Y.ContentType ? /** @type {any} */ (item.content).type : null;

/**
 * @param {YItem} item
 */
const isLineMarker = (item) => typeOf(item)?.name === LINE_MARKER;

/**
 * @param {YItem} item
 */
const isFormat = (item) => item.content instanceof Y.ContentFormat;

/**
 * A format item that ends a run instead of opening one.
 * @param {YItem} item
 */
const isFormatEnd = (item) => {
	const { value } = /** @type {any} */ (item.content);

	return value === null || (Array.isArray(value) && value.length > 0);
};

/**
 * @param {YItem} item
 */
const valueOf = (item) => {
	if (item.deleted && item.content instanceof Y.ContentDeleted) {
		return undefined;
	}

	const type = typeOf(item);

	return type ? undefined : item.content.getContent()[0];
};

const FIELD_NAMES = new Map([
	['t', 'type'],
	['g', 'group'],
	['l', 'level'],
]);

/**
 * @param {string} key
 */
const fieldName = (key) => FIELD_NAMES.get(key) ?? key.replace(/^[a-z]:/, '');

/**
 * @param {string} key
 * @param {unknown} value
 */
const fieldValue = (key, value) => (key === 't' && value === undefined ? 'paragraph' : value);

/**
 * @param {DiffFields} fields
 * @param {string} key
 * @param {unknown} before
 * @param {unknown} after
 * @param {Reverts} reverts Stored names and the values they had before.
 */
const addField = (fields, key, before, after, reverts) => {
	const __old = fieldValue(key, before);
	const __new = fieldValue(key, after);

	if (JSON.stringify(__old) !== JSON.stringify(__new)) {
		fields[fieldName(key)] = { __old, __new };
		reverts[key] = before;
		return true;
	}

	return false;
};

/**
 * @param {DiffMark['type']} type
 * @param {Attrs} attrs
 * @param {DiffFields} [fields]
 */
const createMark = (type, attrs, fields) => {
	/** @type {DiffMark} */
	const mark = { type };

	for (const { name, val } of attrs ?? []) {
		if (name === 'insert' || name === 'delete') {
			mark.by = val;
		} else if (name === 'insertAt' || name === 'deleteAt') {
			mark.at = val;
		}
	}

	if (fields) {
		mark.fields = fields;
	}

	return JSON.stringify(mark);
};

/**
 * Deleted content that should be shown again, picked from everything the range deleted.
 * @param {InstanceType<typeof Y.Doc>} doc
 * @param {InstanceType<typeof Y.IdSet>} deleted
 * @param {InstanceType<typeof Y.IdSet>} inserted
 */
const pickRestorable = (doc, deleted, inserted) => {
	/** @type {Set<YItem>} */
	const candidates = new Set();

	doc.transact((transaction) => {
		Y.iterateStructsByIdSet(transaction, deleted, (struct) => {
			if (struct instanceof Y.Item && !(struct.content instanceof Y.ContentDeleted)) {
				candidates.add(struct);
			}
		});
	});

	/** @param {YItem} item */
	const isInserted = (item) => inserted.hasId(item.id);

	/** @param {YItem} item */
	const inLiveContainer = (item) => {
		const parent = /** @type {YNode} */ (item.parent)._item;

		return parent === null || !parent.deleted;
	};

	/**
	 * The nearest item that is shown, or will be once restored.
	 * @param {YItem} item
	 * @param {'left' | 'right'} side
	 * @param {Set<YItem>} restorable
	 */
	const neighbour = (item, side, restorable) => {
		let next = /** @type {YItem | null} */ (item[side]);

		while (next !== null && (!next.countable || (next.deleted && !restorable.has(next)))) {
			next = /** @type {YItem | null} */ (next[side]);
		}

		return next;
	};

	/** @type {Set<YItem>} */
	const restorable = new Set();
	/** @type {YItem[]} */
	const formats = [];

	/**
	 * Whether the line a pair of markers ends kept content, or never had any: its marker was
	 * then written anew, where a line that lost all its content was removed.
	 * @param {YItem} from The leftmost marker of the pair.
	 */
	const lineIsKept = (from) => {
		let content = 0;

		for (
			let item = neighbour(from, 'left', restorable);
			item !== null && !isLineMarker(item);
			item = neighbour(item, 'left', restorable)
		) {
			if (item.deleted) {
				content++;
			} else if (!isInserted(item)) {
				return true;
			}
		}

		return content === 0;
	};

	for (const item of candidates) {
		if (!inLiveContainer(item)) {
			restorable.add(item);
		} else if (item.parentSub !== null) {
			continue;
		} else if (isFormat(item)) {
			formats.push(item);
		} else {
			restorable.add(item);
		}
	}

	/** @type {Map<YNode, YNode>} */
	const replacedMarkers = new Map();

	for (const item of [...restorable]) {
		if (!isLineMarker(item) || !inLiveContainer(item)) {
			continue;
		}

		const right = neighbour(item, 'right', restorable);
		const left = neighbour(item, 'left', restorable);

		const replacement = [right, left].find(
			(other) =>
				other != null &&
				!other.deleted &&
				isLineMarker(other) &&
				isInserted(other) &&
				!replacedMarkers.has(/** @type {YNode} */ (typeOf(other)))
		);

		if (replacement && !lineIsKept(replacement === left ? replacement : item)) {
			continue;
		}

		if (replacement) {
			restorable.delete(item);
			replacedMarkers.set(
				/** @type {YNode} */ (typeOf(replacement)),
				/** @type {YNode} */ (typeOf(item))
			);
		}
	}

	for (const item of formats) {
		const next = neighbour(item, isFormatEnd(item) ? 'left' : 'right', restorable);

		if (next !== null && restorable.has(next)) {
			restorable.add(item);
		}
	}

	const ids = Y.createIdSet();

	for (const { id, length } of restorable) {
		ids.add(id.client, id.clock, length);
	}

	return { ids, restorable, replacedMarkers };
};

/**
 * @param {YNode} node
 * @param {(key: string, item: YItem) => void} callback
 */
const forEachField = (node, callback) => {
	node._map.forEach((item, key) => {
		if (!IGNORED_FIELDS.has(key)) {
			callback(key, item);
		}
	});
};

/**
 * Fields of a node that the range gave another value.
 * @param {YNode} node
 * @param {InstanceType<typeof Y.IdSet>} inserted
 * @param {InstanceType<typeof Y.IdSet>} deleted
 */
const changedFields = (node, inserted, deleted) => {
	/** @type {DiffFields} */
	const fields = {};
	/** @type {Reverts} */
	const reverts = {};
	/** @type {YItem | null} */
	let changedBy = null;

	forEachField(node, (key, item) => {
		/** @type {YItem | null} */
		let before = item;

		while (before !== null && inserted.hasId(before.id)) {
			before = /** @type {YItem | null} */ (before.left);
		}

		if (before === item && !(item.deleted && deleted.hasId(item.id))) {
			return;
		}

		const gone =
			before === null || (before !== item && before.deleted && !deleted.hasId(before.id));

		if (
			addField(
				fields,
				key,
				gone ? undefined : valueOf(/** @type {YItem} */ (before)),
				item.deleted ? undefined : valueOf(item),
				reverts
			)
		) {
			changedBy = item;
		}
	});

	return { fields, reverts, changedBy: /** @type {YItem | null} */ (changedBy) };
};

/**
 * Fields that differ between a line marker and the one it replaced.
 * @param {YNode} node
 * @param {YNode} replaced
 */
const replacedFields = (node, replaced) => {
	/** @type {DiffFields} */
	const fields = {};
	/** @type {Reverts} */
	const reverts = {};
	/** @type {Map<string, { __old?: unknown, __new?: unknown }>} */
	const values = new Map();

	forEachField(replaced, (key, item) => {
		values.set(key, { __old: valueOf(item) });
	});

	forEachField(node, (key, item) => {
		if (!item.deleted) {
			values.set(key, { ...values.get(key), __new: valueOf(item) });
		}
	});

	for (const [key, { __old, __new }] of values) {
		addField(fields, key, __old, __new, reverts);
	}

	return { fields, reverts };
};

/**
 * @typedef {{ client: number, clock: number, value: unknown }} FormatRun
 */

/**
 * Follows a format item the way a reader of paired runs does, closely enough to tell whether
 * a name shows another value.
 * @param {FormatRun[]} runs
 * @param {YItem} item
 */
const applyFormat = (runs, item) => {
	const { value } = /** @type {any} */ (item.content);
	const { client, clock } = item.id;

	if (value === null) {
		runs.length = 0;
	} else if (isFormatEnd(item)) {
		const [openerClient, openerClock] = value.length === 1 ? [client, clock - value[0]] : value;
		const index = runs.findLastIndex(
			(run) => run.client === openerClient && run.clock === openerClock
		);

		if (index !== -1) {
			runs.splice(index, 1);
		}
	} else {
		runs.push({ client, clock, value });
	}
};

/**
 * @param {FormatRun[]} runs
 */
const shownValue = (runs) => {
	const value = runs.at(-1)?.value;

	return Array.isArray(value) ? undefined : value;
};

/**
 * Content both versions show, whose text formats the range changed.
 * @param {YNode} root
 * @param {import('@y/y').ContentMap} attribution
 * @param {InstanceType<typeof Y.IdSet>} inserted
 * @param {InstanceType<typeof Y.IdSet>} deleted
 */
const findFormatChanges = (root, attribution, inserted, deleted) => {
	const changes = Y.createIdMap();

	/** @param {YNode} container */
	const visit = (container) => {
		/** @type {Map<string, { before: FormatRun[], after: FormatRun[], attrs: Attrs }>} */
		const names = new Map();

		for (let item = container._start; item !== null; item = /** @type {YItem} */ (item.right)) {
			const isShown = !item.deleted;
			const wasShown = !inserted.hasId(item.id) && (isShown || deleted.hasId(item.id));

			if (isFormat(item)) {
				const { key } = /** @type {any} */ (item.content);

				if (!FORMAT_FIELDS.test(key) || (!wasShown && !isShown)) {
					continue;
				}

				const name = names.get(key) ?? { before: [], after: [], attrs: null };
				names.set(key, name);

				if (wasShown !== isShown) {
					name.attrs = (isShown ? attribution.inserts : attribution.deletes).sliceId(
						item.id,
						1
					)[0].attrs;
				}

				if (wasShown) {
					applyFormat(name.before, item);
				}

				if (isShown) {
					applyFormat(name.after, item);
				}

				continue;
			}

			const type = typeOf(item);

			if (type) {
				if (isShown) {
					visit(type);
				}

				continue;
			}

			if (!item.countable || !wasShown || !isShown) {
				continue;
			}

			/** @type {DiffFields} */
			const fields = {};
			/** @type {Reverts} */
			const reverts = {};
			/** @type {Attrs} */
			let attrs = null;

			for (const [key, { before, after, attrs: changedBy }] of names) {
				if (addField(fields, key, shownValue(before), shownValue(after), reverts)) {
					attrs = changedBy ?? attrs;
				}
			}

			if (Object.keys(fields).length) {
				changes.add(item.id.client, item.id.clock, item.length, [
					Y.createContentAttribute('mark', createMark('change', attrs, fields)),
					Y.createContentAttribute('reverts', reverts),
				]);
			}
		}

		container._map.forEach((item) => {
			const slot = item.deleted ? null : typeOf(item);

			if (slot) {
				visit(slot);
			}
		});
	};

	visit(root);

	return changes;
};

/**
 * @typedef {Object} DiffRow
 * @property {string} content Base64 V2 update.
 * @property {Date} createdTimestamp
 * @property {{ userId: string }} metadata
 */

/**
 * The article as it was after `rows[toIndex]`, with what changed since `rows[fromIndex]` shown
 * and marked: deleted content is restored, and every inserted, deleted or changed node carries
 * a `diff` state telling which and by whom. `older` is the same document with the changed
 * fields and text formats as they were at `rows[fromIndex]`.
 * @param {DiffRow[]} rows The article's update chain, in the order it was stored.
 * @param {number} fromIndex
 * @param {number} toIndex
 * @returns {{ newer: Uint8Array, older: Uint8Array }} V2 updates.
 */
export function createDiffUpdates(rows, fromIndex, toIndex) {
	const chain = rows.slice(0, toIndex + 1);
	const attribution = Y.mergeContentMaps(attributeRows(chain).slice(fromIndex + 1));

	const doc = createYDoc(
		convertUpdateFormatV2ToV1(mergePostUpdatesV2(postUpdatesToUint8Arr(chain))),
		{ gc: false }
	);

	try {
		const inserted = Y.createIdSetFromIdMap(attribution.inserts);
		const deleted = Y.diffIdSet(Y.createIdSetFromIdMap(attribution.deletes), inserted);

		const formatChanges = findFormatChanges(
			doc.get(DEFAULT_ROOT_NAME),
			attribution,
			inserted,
			deleted
		);
		const { ids, restorable, replacedMarkers } = pickRestorable(doc, deleted, inserted);

		Y.undoContentIds(doc, Y.createContentIds(Y.createIdSet(), ids));

		const restored = Y.createIdMap();

		for (const item of restorable) {
			if (item.redone === null) {
				continue;
			}

			for (const range of attribution.deletes.slice(item.id.client, item.id.clock, item.length)) {
				restored.add(
					item.redone.client,
					item.redone.clock + (range.clock - item.id.clock),
					range.len,
					range.attrs ?? []
				);
			}
		}

		/** @type {Array<() => void>} */
		const reverts = [];

		/**
		 * @param {YNode} node
		 * @param {Reverts} values
		 */
		const revertNode = (node, values) =>
			reverts.push(() => {
				for (const [key, value] of Object.entries(values)) {
					if (value === undefined) {
						node.deleteAttr(key);
					} else {
						node.setAttr(key, value);
					}
				}
			});

		/**
		 * @param {YItem} item
		 * @returns {Array<{ len: number, mark: string | null, reverts?: Reverts }>}
		 */
		const marksOf = (item) => {
			const { client, clock } = item.id;

			return attribution.inserts.slice(client, clock, item.length).flatMap((range) => {
				if (range.attrs) {
					return [{ len: range.len, mark: createMark('insert', range.attrs), reverts: undefined }];
				}

				return restored.slice(client, range.clock, range.len).flatMap((restoredRange) => {
					if (restoredRange.attrs) {
						return [
							{
								len: restoredRange.len,
								mark: createMark('delete', restoredRange.attrs),
								reverts: undefined,
							},
						];
					}

					return formatChanges
						.slice(client, restoredRange.clock, restoredRange.len)
						.map(({ len, attrs }) => ({
							len,
							mark: attrs ? attrs[0].val : null,
							reverts: attrs?.[1].val,
						}));
				});
			});
		};

		/**
		 * @param {YNode} node
		 * @param {string | null} mark
		 */
		const markNode = (node, mark) => {
			if (mark !== null) {
				node.setAttr(MARK, mark);
				return;
			}

			const replaced = replacedMarkers.get(node);

			if (replaced) {
				const { fields, reverts: values } = replacedFields(node, replaced);

				if (Object.keys(fields).length) {
					revertNode(node, values);

					const item = /** @type {YItem} */ (node._item);

					node.setAttr(
						MARK,
						createMark('change', attribution.inserts.sliceId(item.id, 1)[0].attrs, fields)
					);
				}

				return;
			}

			const { fields, reverts: values, changedBy } = changedFields(node, inserted, deleted);

			if (changedBy !== null) {
				revertNode(node, values);

				const { id, deleted: removed } = /** @type {YItem} */ (changedBy);
				const attrs = (removed ? attribution.deletes : attribution.inserts).sliceId(id, 1)[0].attrs;

				node.setAttr(MARK, createMark('change', attrs, fields));
			}
		};

		/**
		 * @param {YNode} container
		 */
		const markContainer = (container) => {
			/** @type {Array<{ index: number, len: number, mark: string, reverts?: Reverts }>} */
			const segments = [];
			/** @type {Array<[YNode, string | null]>} */
			const nodes = [];
			let index = 0;

			for (let item = container._start; item !== null; item = /** @type {YItem} */ (item.right)) {
				if (item.deleted || !item.countable) {
					continue;
				}

				const type = typeOf(item);

				for (const { len, mark, reverts: values } of marksOf(item)) {
					const last = segments[segments.length - 1];

					if (type) {
						nodes.push([type, mark]);
					} else if (mark !== null && last?.mark === mark && last.index + last.len === index) {
						last.len += len;
					} else if (mark !== null) {
						segments.push({ index, len, mark, reverts: values });
					}

					index += len;
				}
			}

			container._map.forEach((item) => {
				const slot = item.deleted ? null : typeOf(item);

				if (slot) {
					nodes.push([slot, marksOf(item)[0].mark]);
				}
			});

			for (const { index, len, mark, reverts: values } of segments) {
				container.format(index, len, { [MARK]: mark });

				if (values) {
					const formats = Object.fromEntries(
						Object.entries(values).map(([key, value]) => [key, value ?? null])
					);

					reverts.push(() => container.format(index, len, formats));
				}
			}

			for (const [node, mark] of nodes) {
				markNode(node, mark);
				markContainer(node);
			}
		};

		doc.transact(() => markContainer(doc.get(DEFAULT_ROOT_NAME)));

		const newer = Y.encodeStateAsUpdateV2(doc);

		doc.transact(() => reverts.forEach((revert) => revert()));

		return { newer, older: Y.encodeStateAsUpdateV2(doc) };
	} finally {
		doc.destroy();
	}
}
