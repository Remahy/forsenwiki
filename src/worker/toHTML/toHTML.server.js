import 'linkedom-global';
import { base64ToUint8Array } from 'uint8array-extras';
import { workerData, parentPort } from 'node:worker_threads';

import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor';
import { articleConfig } from '$lib/components/editor/config/article';
import { diffConfig } from '$lib/components/editor/config/diff';
import { $getRoot } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { createHeadlessEditor } from '@lexical/headless';

export const toHTMLWorker = async () => {
	/**
	 * @type {{ config: string, content: string, update: string }}
	 */
	const { config, content, update } = workerData;
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


	let editor;
	if (update) {
		const eY = getYjsAndEditor(cfg(null, false, null), base64ToUint8Array(update));
		editor = eY.editor;
	} else {
		editor = createHeadlessEditor(cfg(null, false, null));

		editor.setEditorState(editor.parseEditorState(content));
	}

	editor.update(() => {
		const textInEditor = $getRoot().getTextContent().trim();

		if (textInEditor.length > 0) {
			parentPort?.postMessage($generateHtmlFromNodes(editor, null));
		} else {
			parentPort?.postMessage('');
		}
	});
};

try {
	toHTMLWorker();
} catch (error) {
	console.error('toHTMLWorker error', error);
}
