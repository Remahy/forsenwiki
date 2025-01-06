import 'linkedom-global';

import { workerData, parentPort } from 'node:worker_threads';

import { $getRoot } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { createHeadlessEditor } from '@lexical/headless';
import { base64ToUint8Array } from 'uint8array-extras';

import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor';
import { articleConfig } from '$lib/components/editor/config/article';
import { diffConfig } from '$lib/components/editor/config/diff';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';

export const toHTMLWorker = async (data) => {
	/**
	 * @type {{ config: string, content: string, update: string }}
	 */
	const { config, content, update } = data || workerData || {};

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
	}

	return editor.read(() => {
		const textInEditor = $getRoot().getTextContent().trim();

		if (textInEditor.length > 0) {
			const htmlString = $generateHtmlFromNodes(editor, null);
			parentPort?.postMessage(htmlString);
			return htmlString;
		} else {
			parentPort?.postMessage('');
			return '';
		}
	});
};

if (workerData) {
	try {
		toHTMLWorker();
	} catch (error) {
		console.error('toHTMLWorker error', error);
	}
}
