import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';

import { articleExtension } from '$lib/components/editor/config/article';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';
import { getYAndEditor, readState } from '$lib/y/headless';
import { mergePostUpdatesV2 } from '$lib/y/utils';
import { getYjsAndEditor } from './getYjsAndEditor';
import { createNewYDoc, encodeYDocToUpdateV2 } from './utils';

export const config = () => articleExtension(null, EDITOR_IS_READONLY, null);

export const $paragraph = (text: string) => $createParagraphNode().append($createTextNode(text));

export const $write = (text: string) => () => {
	$getRoot().append($paragraph(text));
};

export const legacyEdit = ($edit: () => void, update = encodeYDocToUpdateV2(createNewYDoc())) => {
	const { editor, doc } = getYjsAndEditor(config(), update);
	editor.update($edit, { discrete: true });
	return encodeYDocToUpdateV2(doc);
};

export const edited = async (updateV2: Uint8Array, $edit: () => void) => {
	const article = getYAndEditor(config(), updateV2);
	article.editor.update($edit, { discrete: true });
	const update = await article.encodeV2();
	article.dispose();
	return update;
};

const $blocks = () =>
	$getRoot()
		.getChildren()
		.map((node) => node.getTextContent().trim());

export const read = (...updates: Uint8Array[]) =>
	readState(config(), mergePostUpdatesV2(updates as never), $blocks);
