import 'linkedom-global';

import { workerData, parentPort, isMainThread } from 'node:worker_threads';

import { $getRoot, $nodesOfType } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { createHeadlessEditor } from '@lexical/headless';
import { base64ToUint8Array } from 'uint8array-extras';

import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor';
import { articleConfig } from '$lib/components/editor/config/article';
import { diffConfig } from '$lib/components/editor/config/diff';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';
import { ImageNode } from '$lib/lexical/custom';
import { migrations } from '$lib/components/editor/migrations';

const $$getTextInEditor = () => {
	return $getRoot().getTextContent().trim().replace(/\n+/gm, '\n');
};

const $$getFirstImage = () => {
	const images = $nodesOfType(ImageNode);
	const firstImage = /** @type {ImageNode | null} */ (images?.[0]);

	return firstImage?.getSrc() || '';
};

/**
 * @param {{ config: string, content: string, update: string }} data
 */
export const toHTMLWorker = async ({ config, content, update }) => {
	if (!config) {
		throw new Error('No config string provided.');
	}

	if (!content && !update) {
		throw new Error('No content and/or update provided.');
	}

	let cfg;
	switch (config) {
		case 'diff':
			cfg = diffConfig;
			break;
		default:
			cfg = articleConfig;
			break;
	}

	/**
	 * @type {import('lexical').LexicalEditor}
	 */
	let editor;
	if (update) {
		const eY = getYjsAndEditor(cfg(null, EDITOR_IS_READONLY, null), base64ToUint8Array(update));
		editor = eY.editor;
	} else {
		editor = createHeadlessEditor(cfg(null, EDITOR_IS_READONLY, null));

		editor.setEditorState(editor.parseEditorState(content));

		migrations(editor);
	}

	return editor.read(() => {
		const text = $$getTextInEditor().replace(/\n/g, ' ');
		const image = $$getFirstImage();
		const htmlString = $generateHtmlFromNodes(editor, null);

		/**
		 * @type {{ html: string, text: string, image?: string }}
		 */
		const response = { html: htmlString, text, image };

		return response;
	});
};

if (!isMainThread && parentPort && workerData) {
	toHTMLWorker(workerData).then(
		(data) => parentPort.postMessage(data),
		(err) => parentPort.postMessage({ error: String(err?.message ?? err) })
	);
}
