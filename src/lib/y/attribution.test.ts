import * as Y from '@y/y';
import { expect, test } from 'vitest';

import { uint8ArrayToBase64 } from 'uint8array-extras';

import { attributeRows } from './attribution';

const row = (update: Uint8Array, userId: string, at: number) => ({
	content: uint8ArrayToBase64(update),
	createdTimestamp: new Date(at),
	metadata: { userId },
});

const idsOf = (map: Y.IdMap<any>) => Y.createIdSetFromIdMap(map);
const attrsOf = (map: Y.IdMap<any>) => {
	const attrs: Record<string, any> = {};
	map.forEach((range) => range.attrs.forEach(({ name, val }) => (attrs[name] = val)));
	return attrs;
};

test('each update is attributed to its own author only', () => {
	const doc = new Y.Doc({ gc: false });
	const text = doc.get('text');

	text.insert(0, 'hello world');
	const first = Y.encodeStateAsUpdateV2(doc);

	text.delete(0, 6);
	text.insert(5, '!');
	const second = Y.diffUpdateV2(
		Y.encodeStateAsUpdateV2(doc),
		Y.encodeStateVectorFromUpdateV2(first)
	);

	text.delete(0, 1);
	const third = Y.diffUpdateV2(
		Y.encodeStateAsUpdateV2(doc),
		Y.encodeStateVectorFromUpdateV2(Y.mergeUpdatesV2([first, second]))
	);

	const rows = [row(first, 'a', 1000), row(second, 'b', 2000), row(third, 'c', 3000)];
	const maps = attributeRows(rows);
	const [a, b, c] = maps;

	expect(attrsOf(a.inserts)).toEqual({ insert: 'a', insertAt: 1000 });
	expect(idsOf(a.deletes).isEmpty()).toBe(true);

	expect(attrsOf(b.inserts)).toEqual({ insert: 'b', insertAt: 2000 });
	expect(attrsOf(b.deletes)).toEqual({ delete: 'b', deleteAt: 2000 });

	expect(idsOf(c.inserts).isEmpty()).toBe(true);
	expect(attrsOf(c.deletes)).toEqual({ delete: 'c', deleteAt: 3000 });
	expect(Y.intersectSets(idsOf(c.deletes), idsOf(b.deletes)).isEmpty()).toBe(true);

	const merged = Y.mergeContentMaps(maps);
	const all = Y.createContentIdsFromDoc(doc, true);

	expect(Y.equalIdSets(idsOf(merged.inserts), all.inserts)).toBe(true);
	expect(Y.equalIdSets(idsOf(merged.deletes), all.deletes)).toBe(true);
});

test('derived attributions render like the Yjs attribution guide, with user ids', () => {
	const author = new Y.Doc();
	author.get('text').insert(0, 'Hello World!');
	const first = Y.encodeStateAsUpdateV2(author);

	const editor = new Y.Doc();
	Y.applyUpdateV2(editor, first);
	const text = editor.get('text');
	text.format(0, 4, { italic: true });
	text.delete(6, 5);
	text.insert(6, 'attributions');
	const second = Y.diffUpdateV2(
		Y.encodeStateAsUpdateV2(editor),
		Y.encodeStateVectorFromUpdateV2(first)
	);

	const [, bobs] = attributeRows([row(first, 'alice-id', 1000), row(second, 'bob-id', 2000)]);

	const history = new Y.Doc({ gc: false });
	Y.applyUpdateV2(history, Y.mergeUpdatesV2([first, second]));

	const renderer = Y.createAttributionsRenderer(bobs);
	const rendered = history.get('text').toDelta({ renderer }).toJSON();

	expect(rendered.children).toEqual([
		{
			type: 'insert',
			insert: 'Hell',
			format: { italic: true },
			attribution: { format: { italic: ['bob-id'] }, formatAt: 2000 },
		},
		{ type: 'insert', insert: 'o ' },
		{
			type: 'insert',
			insert: 'World',
			attribution: { delete: ['bob-id'], deleteAt: 2000 },
		},
		{
			type: 'insert',
			insert: 'attributions',
			attribution: { insert: ['bob-id'], insertAt: 2000 },
		},
		{ type: 'insert', insert: '!' },
	]);
});
