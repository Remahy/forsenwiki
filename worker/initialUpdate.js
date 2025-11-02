import { workerData, parentPort } from 'node:worker_threads';

import { $createTextNode, $getRoot, $createParagraphNode } from 'lexical';

import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor';
import {
	encodeYDocToUpdateV2ToBase64,
	encodeYDocToUpdateV2,
	createNewYDoc,
	YXmlText,
} from '$lib/yjs/utils';
import { articleConfig } from '$lib/components/editor/config/article';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';

export const initialUpdateWorker = () => {
	let emptyUpdate;
	{
		const yDoc = createNewYDoc();
		yDoc.get('root', YXmlText);
		emptyUpdate = encodeYDocToUpdateV2(yDoc);
	}

	const { doc, editor } = getYjsAndEditor(
		articleConfig(null, EDITOR_IS_READONLY, null),
		emptyUpdate
	);

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

	return editor.read(() => {
		const encodedContent = encodeYDocToUpdateV2ToBase64(doc);

		parentPort?.postMessage(encodedContent);
		return encodedContent;
	});
};

if (workerData) {
	try {
		initialUpdateWorker();
	} catch (error) {
		console.error('initialUpdateWorker error', error);
	}
}
