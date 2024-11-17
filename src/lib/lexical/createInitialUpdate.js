import {
	$createTextNode as createTextNode,
	$getRoot,
	$createParagraphNode as createParagraphNode,
} from 'lexical';

import { Y } from '$lib/yjs/index.mjs';

import { articleConfig } from '$lib/components/editor/config/article';
import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor';

export const createInitialUpdate = () => {
	const { doc, editor } = getYjsAndEditor(articleConfig(null, true, null), null);

	editor.update(
		() => {
			const text = createTextNode('forsen');
			const p = createParagraphNode();

			p.append(text);

			const root = $getRoot();

			root.append(p);
		},
		{ discrete: true }
	);

	return Y.encodeStateAsUpdateV2(doc);
};
