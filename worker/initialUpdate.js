import { workerData, parentPort } from 'node:worker_threads';

import { uint8ArrayToBase64 } from 'uint8array-extras';
import { $createTextNode, $getRoot, $createParagraphNode } from 'lexical';

import { Y } from '$lib/yjs/index.mjs';
import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor';
import { articleConfig } from '$lib/components/editor/config/article';
import { EDITOR_IS_READONLY } from '../src/types';

export const initialUpdateWorker = () => {
	let emptyUpdate;
	{
		const yDoc = new Y.Doc();
		yDoc.get('root', Y.XmlText);
		emptyUpdate = Y.encodeStateAsUpdateV2(yDoc);
	}

	const { doc, editor } = getYjsAndEditor(articleConfig(null, EDITOR_IS_READONLY, null), emptyUpdate);

	editor.update(
		() => {
			const text = $createTextNode('forsen');
			const p = $createParagraphNode();

			p.append(text);

			const root = $getRoot();

			root.append(p);
		},
		{ discrete: true }
	);

	const base64 = uint8ArrayToBase64(Y.encodeStateAsUpdateV2(doc));

	parentPort?.postMessage(base64);

	return base64;
};

if (workerData) {
	try {
		initialUpdateWorker();
	} catch (error) {
		console.error('initialUpdateWorker error', error);
	}
}
