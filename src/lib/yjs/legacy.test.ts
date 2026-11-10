import { expect, test } from 'vitest';
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';
import { $createLinkNode } from '@lexical/link';
import { $createTableNodeWithDimensions } from '@lexical/table';

import { articleExtension } from '$lib/components/editor/config/article';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';
import { readState, seedFromJSON } from '$lib/y/headless';
import { getYjsAndEditor } from './getYjsAndEditor';
import { legacyUpdateToJSON } from './legacyUpdateToJSON';
import { createNewYDoc, encodeYDocToUpdateV2 } from './utils';

const config = () => articleExtension(null, EDITOR_IS_READONLY, null);

/** An article as the Yjs 13 editor stored it. */
const legacyArticle = () => {
	const { editor, doc } = getYjsAndEditor(config(), encodeYDocToUpdateV2(createNewYDoc()));
	editor.update(
		() => {
			$getRoot().append(
				$createParagraphNode().append(
					$createTextNode('see '),
					$createLinkNode('https://example.com').append($createTextNode('the docs'))
				),
				$createTableNodeWithDimensions(1, 2, false)
			);
		},
		{ discrete: true }
	);
	return encodeYDocToUpdateV2(doc);
};

test('a Yjs 13 article converts to Lexical JSON', () => {
	const json = legacyUpdateToJSON(legacyArticle());

	expect(json.root.children.map(({ type }) => type)).toEqual(['paragraph', 'a-table']);
});

test('a Yjs 13 article seeds a Yjs 14 document with the same content', () => {
	const json = legacyUpdateToJSON(legacyArticle());
	const seed = seedFromJSON(config(), json);

	const text = readState(config(), seed, () => $getRoot().getTextContent());
	expect(text).toBe('see the docs\n\n\n\n');
	expect(readState(config(), seed, () => $getRoot().getChildrenSize())).toBe(2);
});
