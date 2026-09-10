import 'linkedom-global';

import { workerData, parentPort } from 'node:worker_threads';

import { $getRoot, $nodesOfType } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { base64ToUint8Array } from 'uint8array-extras';

import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor';
import { articleConfig } from '$lib/components/editor/config/article';
import { diffConfig } from '$lib/components/editor/config/diff';
import { EDITOR_IS_EDITABLE } from '$lib/constants/constants';
import { ImageNode } from '$lib/lexical/custom';
import { migrations } from '$lib/components/editor/migrations';

const $$getTextInEditor = () => {
	return $getRoot().getTextContent().trim().replace(/\n+/gm, '\n');
};

const $$getFirstImage = () => {
	const images = $nodesOfType(ImageNode);
	const firstImage = images?.[0];

	return firstImage?.getSrc() || '';
};

export const toHTMLWorker = async (data) => {
	/**
	 * @type {{ config: string, update: string }}
	 */
	const { config, update } = data || workerData || {};

	if (!config) {
		throw new Error('No config string provided.');
	}

	if (!update) {
		throw new Error('No update provided.');
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

	const { editor } = getYjsAndEditor(cfg(null, EDITOR_IS_EDITABLE, null), base64ToUint8Array(update));
	migrations(editor);

	return editor.read(() => {
		const text = $$getTextInEditor().replace(/\n/g, ' ');
		const image = $$getFirstImage();

		const htmlString = $generateHtmlFromNodes(editor, null);
		const response = { html: htmlString, text, image };
		parentPort?.postMessage(response);
		return response;
	});
};

if (workerData) {
	try {
		toHTMLWorker();
	} catch (err) {
		console.error('toHTMLWorker error', err);
	}
}
